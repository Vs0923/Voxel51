"""
A tool to search for running service processes.

For supported options, run with --help.
"""
import argparse
import os
import psutil

os.environ["FIFTYONE_DISABLE_SERVICES"] = "1"
import fiftyone.service.util as fosu

parser = argparse.ArgumentParser(
    description="Search for running FiftyOne services"
)
args = parser.parse_args()

seen = set()
for p in fosu.find_processes_by_args(["--51-service"]):
    p = fosu.normalize_wrapper_process(p)
    if p.pid not in seen:
        seen.add(p.pid)
        cmdline = p.cmdline()
        service_name = cmdline[cmdline.index("--51-service") + 1]
        ports = []
        for child in p.children(recursive=True):
            try:
                ports.extend(list(fosu.get_listening_tcp_ports(child)))
            except psutil.Error:
                pass
        print(
            "{pid} service={service_name} ports={ports}".format(
                pid=p.pid,
                service_name=service_name,
                ports=",".join(map(str, ports)),
            )
        )
