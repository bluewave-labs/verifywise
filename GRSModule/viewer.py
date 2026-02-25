"""GRS Scenario Viewer — navigation entry point.

Launch:
    cd GRSModule
    uv run streamlit run viewer.py
"""

import streamlit as st

st.set_page_config(
    page_title="GRS Scenario Viewer",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)

pg = st.navigation(
    [
        st.Page("pages/GRS_Scenario_Viewer.py", title="GRS Scenario Viewer", icon="🔍"),
        st.Page("pages/1_Scenario_Inspector.py", title="Scenario Inspector", icon="🔬"),
    ]
)
pg.run()
