"""
Backing document classes for :class:`fiftyone.core.sample.Sample` instances.

Class hierarchy::

    SampleDocument
    └── DatasetSampleDocument
        ├── my_custom_dataset
        ├── another_dataset
        └── ...

Design invariants:

-   A :class:`fiftyone.core.sample.Sample` always has a backing
    ``sample._doc``, which is an instance of a subclass of
    :class:`SampleDocument`

**Implementation details**

When a new :class:`fiftyone.core.sample.Sample` is created, its ``_doc``
attribute is `None`

    import fiftyone as fo

    sample = fo.Sample()
    sample._doc  # None

When a new :class:`fiftyone.core.dataset.Dataset` is created, its
``_sample_doc_cls`` attribute holds a dynamically created subclass of
:class:`DatasetSampleDocument` whose name is the name of the dataset::

    dataset = fo.Dataset(name="my_dataset")

When a sample is added to a dataset, its ``_doc`` attribute is changed from


    dataset.add_sample(sample)
    sample._doc  # my_dataset(DatasetSampleDocument)

| Copyright 2017-2020, Voxel51, Inc.
| `voxel51.com <https://voxel51.com/>`_
|
"""
from collections import OrderedDict
from functools import wraps
import numbers
import random

from mongoengine.errors import InvalidQueryError
import numpy as np
import six

import fiftyone.core.fields as fof
import fiftyone.core.metadata as fom

from .dataset import SampleFieldDocument, DatasetDocument
from .document import (
    Document,
    BaseEmbeddedDocument,
)


# Use our own Random object to avoid messing with the user's seed
_random = random.Random()


def _generate_rand(filepath=None):
    if filepath is not None:
        _random.seed(filepath)

    return _random.random() * 0.001 + 0.999


def default_sample_fields(include_private=False):
    """The default fields present on all :class:`SampleDocument` objects.

    Args:
        include_private (False): whether to include fields that start with `_`

    Returns:
        a tuple of field names
    """
    return DatasetSampleDocument._get_fields_ordered(
        include_private=include_private
    )


def no_delete_default_field(func):
    """Wrapper for :func:`SampleDocument.delete_field` that prevents deleting
    default fields of :class:`SampleDocument`.

    This is a decorator because the subclasses implement this as either an
    instance or class method.
    """

    @wraps(func)
    def wrapper(cls_or_self, field_name, *args, **kwargs):
        # pylint: disable=no-member
        if field_name in default_sample_fields():
            raise ValueError("Cannot delete default field '%s'" % field_name)

        return func(cls_or_self, field_name, *args, **kwargs)

    return wrapper


class DatasetSampleDocument(Document):
    """Base class for sample documents backing samples in datasets.

    All ``fiftyone.core.dataset.DatasetHelper._sample_doc_cls`` classes inherit
    from this class.
    """

    meta = {"abstract": True}

    # The path to the data on disk
    filepath = fof.StringField(unique=True)

    # The set of tags associated with the sample
    tags = fof.ListField(fof.StringField())

    # Metadata about the sample media
    metadata = fof.EmbeddedDocumentField(fom.Metadata, null=True)

    # Random float used for random dataset operations (e.g. shuffle)
    _rand = fof.FloatField(default=_generate_rand)

    def __setattr__(self, name, value):
        # pylint: disable=no-member
        has_field = self.has_field(name)

        if name.startswith("_") or (hasattr(self, name) and not has_field):
            super().__setattr__(name, value)
            return

        if not has_field:
            raise ValueError(
                "Adding sample fields using the `sample.field = value` syntax "
                "is not allowed; use `sample['field'] = value` instead"
            )

        if value is not None:
            self._fields[name].validate(value)

        super().__setattr__(name, value)

    @property
    def field_names(self):
        return tuple(
            f
            for f in self._get_fields_ordered(include_private=False)
            if f != "id"
        )

    @classmethod
    def get_field_schema(
        cls, ftype=None, embedded_doc_type=None, include_private=False
    ):
        """Returns a schema dictionary describing the fields of this sample.

        If the sample belongs to a dataset, the schema will apply to all
        samples in the dataset.

        Args:
            ftype (None): an optional field type to which to restrict the
                returned schema. Must be a subclass of
                :class:`fiftyone.core.fields.Field`
            embedded_doc_type (None): an optional embedded document type to
                which to restrict the returned schema. Must be a subclass of
                :class:`fiftyone.core.odm.BaseEmbeddedDocument`
            include_private (False): whether to include fields that start with
                `_` in the returned schema

        Returns:
             a dictionary mapping field names to field types
        """
        if ftype is None:
            ftype = fof.Field

        if not issubclass(ftype, fof.Field):
            raise ValueError(
                "Field type %s must be subclass of %s" % (ftype, fof.Field)
            )

        if embedded_doc_type and not issubclass(
            ftype, fof.EmbeddedDocumentField
        ):
            raise ValueError(
                "embedded_doc_type should only be specified if ftype is a"
                " subclass of %s" % fof.EmbeddedDocumentField
            )

        d = OrderedDict()
        field_names = cls._get_fields_ordered(include_private=include_private)
        for field_name in field_names:
            # pylint: disable=no-member
            field = cls._fields[field_name]
            if not isinstance(cls._fields[field_name], ftype):
                continue

            if embedded_doc_type and not issubclass(
                field.document_type, embedded_doc_type
            ):
                continue

            d[field_name] = field

        return d

    def has_field(self, field_name):
        """Determines whether the sample has a field of the given name.

        Args:
            field_name: the field name

        Returns:
            True/False
        """
        # pylint: disable=no-member
        return field_name in self._fields

    @classmethod
    def add_field(
        cls,
        field_name,
        ftype,
        embedded_doc_type=None,
        subfield=None,
        save=True,
    ):
        """Adds a new field to the sample.

        Args:
            field_name: the field name
            ftype: the field type to create. Must be a subclass of
                :class:`fiftyone.core.fields.Field`
            embedded_doc_type (None): the
                :class:`fiftyone.core.odm.BaseEmbeddedDocument` type of the
                field. Used only when ``ftype`` is an embedded
                :class:`fiftyone.core.fields.EmbeddedDocumentField`
            subfield (None): the type of the contained field. Used only when
                ``ftype`` is a :class:`fiftyone.core.fields.ListField` or
                :class:`fiftyone.core.fields.DictField`
        """
        # Additional arg `save` is to prevent saving the fields when reloading
        # a dataset from the database.

        # pylint: disable=no-member
        if field_name in cls._fields:
            raise ValueError("Field '%s' already exists" % field_name)

        field = _create_field(
            field_name,
            ftype,
            embedded_doc_type=embedded_doc_type,
            subfield=subfield,
        )

        cls._fields[field_name] = field
        cls._fields_ordered += (field_name,)
        try:
            if issubclass(cls, DatasetSampleDocument):
                # Only set the attribute if it is a class
                setattr(cls, field_name, field)
        except TypeError:
            # Instance, not class, so do not `setattr`
            pass

        if save:
            # Update dataset meta class
            dataset_doc = DatasetDocument.objects.get(
                sample_collection_name=cls.__name__
            )

            field = cls._fields[field_name]
            sample_field = SampleFieldDocument.from_field(field)
            dataset_doc.sample_fields.append(sample_field)
            dataset_doc.save()

    @classmethod
    def add_implied_field(cls, field_name, value):
        """Adds the field to the sample, inferring the field type from the
        provided value.

        Args:
            field_name: the field name
            value: the field value
        """
        # pylint: disable=no-member
        if field_name in cls._fields:
            raise ValueError("Field '%s' already exists" % field_name)

        cls.add_field(field_name, **_get_implied_field_kwargs(value))

    def set_field(self, field_name, value, create=False):
        """Sets the value of a field of the sample.

        Args:
            field_name: the field name
            value: the field value
            create (False): whether to create the field if it does not exist

        Raises:
            ValueError: if ``field_name`` is not an allowed field name or does
                not exist and ``create == False``
        """
        if field_name.startswith("_"):
            raise ValueError(
                "Invalid field name: '%s'. Field names cannot start with '_'"
                % field_name
            )

        if hasattr(self, field_name) and not self.has_field(field_name):
            raise ValueError("Cannot use reserved keyword '%s'" % field_name)

        if not self.has_field(field_name):
            if create:
                self.add_implied_field(field_name, value)
            else:
                msg = "Sample does not have field '%s'." % field_name
                if value is not None:
                    # don't report this when clearing a field.
                    msg += " Use `create=True` to create a new field."
                raise ValueError(msg)

        self.__setattr__(field_name, value)

    def clear_field(self, field_name):
        """Clears the value of a field of the sample.

        Args:
            field_name: the field name

        Raises:
            ValueError: if the field does not exist
        """
        self.set_field(field_name, None, create=False)

    @classmethod
    @no_delete_default_field
    def delete_field(cls, field_name):
        """Deletes the field from the sample.

        If the sample is in a dataset, the field will be removed from all
        samples in the dataset.

        Args:
            field_name: the field name

        Raises:
            AttributeError: if the field does not exist
        """
        try:
            # Delete from all samples
            # pylint: disable=no-member
            cls.objects.update(**{"unset__%s" % field_name: None})
        except InvalidQueryError:
            raise AttributeError("Sample has no field '%s'" % field_name)

        # Remove from dataset
        # pylint: disable=no-member
        del cls._fields[field_name]
        cls._fields_ordered = tuple(
            fn for fn in cls._fields_ordered if fn != field_name
        )
        delattr(cls, field_name)

        # Update dataset meta class
        dataset_doc = DatasetDocument.objects.get(
            sample_collection_name=cls.__name__
        )
        dataset_doc.sample_fields = [
            sf for sf in dataset_doc.sample_fields if sf.name != field_name
        ]
        dataset_doc.save()

    def _update(self, object_id, update_doc, filtered_fields=None, **kwargs):
        """Updates an existing document.

        Helper method; should only be used inside
        :meth:`DatasetSampleDocument.save`.
        """
        updated_existing = True

        collection = self._get_collection()

        select_dict = {"_id": object_id}

        extra_updates = self._extract_extra_updates(
            update_doc, filtered_fields
        )

        if update_doc:
            result = collection.update_one(
                select_dict, update_doc, upsert=True
            ).raw_result
            if result is not None:
                updated_existing = result.get("updatedExisting")

        for update, element_id in extra_updates:
            result = collection.update_one(
                select_dict,
                update,
                array_filters=[{"element._id": element_id}],
                upsert=True,
            ).raw_result

            if result is not None:
                updated_existing = updated_existing and result.get(
                    "updatedExisting"
                )

        return updated_existing

    def _extract_extra_updates(self, update_doc, filtered_fields):
        """Extracts updates for filtered list fields that need to be updated
        by ID, not relative position (index).
        """
        extra_updates = []

        #
        # Check for illegal modifications
        # Match the list, or an indexed item in the list, but not a field
        # of an indexed item of the list:
        #   my_detections.detections          <- MATCH
        #   my_detections.detections.1        <- MATCH
        #   my_detections.detections.1.label  <- NO MATCH
        #
        if filtered_fields:
            for d in update_doc.values():
                for k in d.keys():
                    for ff in filtered_fields:
                        if k.startswith(ff) and not k.lstrip(ff).count("."):
                            raise ValueError(
                                "Modifying root of filtered list field '%s' "
                                "is not allowed" % k
                            )

        if filtered_fields and "$set" in update_doc:
            d = update_doc["$set"]
            del_keys = []

            for k, v in d.items():
                filtered_field = None
                for ff in filtered_fields:
                    if k.startswith(ff):
                        filtered_field = ff
                        break

                if filtered_field:
                    element_id, el_filter = self._parse_id_and_array_filter(
                        k, filtered_field
                    )
                    extra_updates.append(
                        ({"$set": {el_filter: v}}, element_id)
                    )

                    del_keys.append(k)

            for k in del_keys:
                del d[k]

            if not update_doc["$set"]:
                del update_doc["$set"]

        return extra_updates

    def _parse_id_and_array_filter(self, list_element_field, filtered_field):
        """Converts the ``list_element_field`` and ``filtered_field`` to an
        element object ID and array filter.

        Example::

            Input:
                list_element_field = "test_dets.detections.1.label"
                filtered_field = "test_dets.detections"

            Output:
                ObjectID("5f2062bf27c024654f5286a0")
                "test_dets.detections.$[element].label"
        """
        el = self
        for field_name in filtered_field.split("."):
            el = el[field_name]

        el_fields = list_element_field.lstrip(filtered_field).split(".")
        idx = int(el_fields.pop(0))

        el = el[idx]
        el_filter = ".".join([filtered_field, "$[element]"] + el_fields)

        return el._id, el_filter

    @classmethod
    def _get_fields_ordered(cls, include_private=False):
        if include_private:
            return cls._fields_ordered
        return tuple(f for f in cls._fields_ordered if not f.startswith("_"))


def _get_implied_field_kwargs(value):
    if isinstance(value, BaseEmbeddedDocument):
        return {
            "ftype": fof.EmbeddedDocumentField,
            "embedded_doc_type": type(value),
        }

    if isinstance(value, bool):
        return {"ftype": fof.BooleanField}

    if isinstance(value, six.integer_types):
        return {"ftype": fof.IntField}

    if isinstance(value, numbers.Number):
        return {"ftype": fof.FloatField}

    if isinstance(value, six.string_types):
        return {"ftype": fof.StringField}

    if isinstance(value, (list, tuple)):
        return {"ftype": fof.ListField}

    if isinstance(value, np.ndarray):
        if value.ndim == 1:
            return {"ftype": fof.VectorField}

        return {"ftype": fof.ArrayField}

    if isinstance(value, dict):
        return {"ftype": fof.DictField}

    raise TypeError("Unsupported field value '%s'" % type(value))


def _create_field(field_name, ftype, embedded_doc_type=None, subfield=None):
    if not issubclass(ftype, fof.Field):
        raise ValueError(
            "Invalid field type '%s'; must be a subclass of '%s'"
            % (ftype, fof.Field)
        )

    kwargs = {"db_field": field_name}

    if issubclass(ftype, fof.EmbeddedDocumentField):
        kwargs.update({"document_type": embedded_doc_type})
        kwargs["null"] = True
    elif issubclass(ftype, (fof.ListField, fof.DictField)):
        if subfield is not None:
            kwargs["field"] = subfield
    else:
        kwargs["null"] = True

    field = ftype(**kwargs)
    field.name = field_name

    return field
