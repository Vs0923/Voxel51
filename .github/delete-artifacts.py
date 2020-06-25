#!/usr/bin/env python3
"""
Deletes old artifacts from GitHub actions workflows

Relevant API documentation: https://developer.github.com/v3/actions/artifacts/
"""

import datetime
import itertools
import os

import requests


def parse_datetime(s):
    return datetime.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ")


token = os.environ["TOKEN"]
repo = os.environ["GITHUB_REPOSITORY"]
base_url = "https://api.github.com/repos/%s/actions/artifacts" % repo
now = datetime.datetime.utcnow()

print("Collecting artifacts...")
artifacts = []
for page in itertools.count(1):
    r = requests.get(base_url, params={"page": page}, auth=(token, token))
    r.raise_for_status()
    if not r.json()["artifacts"]:
        break
    artifacts.extend(r.json()["artifacts"])
    if len(artifacts) >= r.json()["total_count"]:
        break
print("Collected %i artifacts" % len(artifacts))
remaining = int(r.headers["X-RateLimit-Remaining"])
print("Rate limit remaining: %i" % remaining)
if remaining - len(artifacts) < 100:
    print("Delaying until rate limit resets")
    exit(0)

deleted_count = 0
for a in artifacts:
    created_time = parse_datetime(a["created_at"])
    created_delta = now - created_time
    should_delete = created_delta > datetime.timedelta(hours=24)
    print(
        "%s artifact %r (ID: %i, created: %s, size: %i)"
        % (
            "Deleting" if should_delete else "Skipping",
            a["name"],
            a["id"],
            a["created_at"],
            a["size_in_bytes"],
        )
    )
    if should_delete:
        try:
            r = requests.delete(
                base_url + "/" + str(a["id"]), auth=(token, token)
            )
            r.raise_for_status()
            deleted_count += 1
        except requests.RequestException as e:
            print(e)

print("Deleted %i artifacts" % deleted_count)
