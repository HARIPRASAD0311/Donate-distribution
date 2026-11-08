.PHONY: reset-db import-data test dev

PYTHON ?= python

reset-db:
	$(PYTHON) -m backend.app.data_importer --reset

import-data:
	$(PYTHON) -m backend.app.data_importer

test:
	$(PYTHON) -m pytest backend/tests

dev:
	$(PYTHON) -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
