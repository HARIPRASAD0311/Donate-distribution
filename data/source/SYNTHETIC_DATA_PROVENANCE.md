# Synthetic flood fixture provenance

The frontend is now seeded with synthetic planning data for the **Assam Brahmaputra Flood Response** scenario. The fixture values are generated for demonstration and testing; they are not a replacement for live ASDMA, IMD, CWC, or district control-room telemetry.

The contextual anchor is the July 2024 Assam flood response. ReliefWeb’s disaster overview, citing an Assam State Disaster Management Authority report dated 2 July 2024, described flooding in 19 districts, more than 640,000 people affected, 72 relief camps, and 64 relief centres. The app uses those reported figures only as scenario context and clearly labels the operational records as synthetic.

The broader flood-event framing follows a peer-reviewed study of India’s 2024 monsoon floods, which describes multi-day extreme precipitation as a driver of major flooding and reports large impacts across several Indian regions.

## Fixture layout

- `src/data/assets/*.csv` contains flat operational tables for incidents, facilities, inventory, beneficiary groups, demands, dispatches, audit events, geographic locations, and disaster zones.
- `src/data/assets/scenario.json` contains nested command-centre, network-map, allocation, and recovery scenario contracts.
- The adjacent `.js` bridge files are generated compatibility wrappers so the same CSV/JSON fixture content can be loaded by Vite in the browser and by the Node test runner.
- Data adapters in `src/data/fixtureData.js`, `src/mock-data/`, and feature `data/` modules are now the only frontend entry points for these records.

## Sources

- [1]: https://reliefweb.int/disaster/fl-2024-000109-ind "India: Floods and Landslides - Jul 2024"
- [2]: https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2024EF005497 "Multi-Day Extreme Precipitation Caused Major Floods in India During Summer Monsoon of 2024"
