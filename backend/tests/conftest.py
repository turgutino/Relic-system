"""Test harness: disable Neo4j driver so endpoints use JSON fallback."""

import os

# Must run before `app` (and dotenv) import.
os.environ["NEO4J_URI"] = ""
