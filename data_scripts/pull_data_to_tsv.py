"""
This file contains a simple script for pulling the goals_vs_rewards data
out of a database and into a tab seperated value file for further processing.

Usage:
    python pull_data_to_tsv.py table_name db_url

Writes:
    db_name_table_name.tsv
    db_name_table_name_aux.tsv
"""

from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import query
import json
import pandas as pd
# import pdb
# pdb.set_trace()


def main(table_name, db_url):
    # DB program + :// + path from this file to the database
    # db_url = "sqlite:///participants.db"
    # db_url = "mysql://ccnberkeley:CalBears@localhost/goals_vs_rewards"

    # Boilerplate sqlalchemy setup
    engine        = create_engine(db_url)
    metadata      = MetaData()
    metadata.bind = engine
    table         = Table(table_name, metadata, autoload=True)

    # Make a query and loop through
    selection = table.select()
    rows      = selection.execute()

    # Status codes of subjects who completed experiment
    # ToDo: Check these against goals_vs_rewards status settings.
    statuses = [3, 4, 5, 7]

    # Hardcode any worker exclusion
    exclude = []

    # Extract table headers
    column_names = []
    column_descs = query.Query(table).column_descriptions
    for metadatum in column_descs:
        column_names.append(metadatum['name'])

    # Initialize data objects
    data_aux  = []
    data_strs = []

    # Extract table rows. One row should corrospond to one worker's data.
    for row in rows:
        if row['status'] in statuses and row['uniqueid'] not in exclude:
            # Save the data strings to be unpacked
            data_strs.append(row['datastring'])

            # Save the auxiliary data.
            for key in column_names:
                data_aux.append(row[key])

    # Now we have all participant datastrings in a list.
    # Let's make it a bit easier to work with:
    # parse each participant's datastring as json object
    # and take the 'data' sub-object
#    data_alt = []
#    for part in data_strs:
#        data_alt.append(json.loads(part)['data'])
#        data_alt.append(json.loads(part)['questiondata'])

#    data_strs = data_alt
#    data_qs   = [json.loads(part)['questiondata'] for part in data_strs]
    data_strs = [json.loads(part)['data'] for part in data_strs]

    # insert uniqueid field into trialdata in case it wasn't added
    # in experiment:
    for part in data_strs:
        for record in part:
            record['trialdata']['uniqueid'] = record['uniqueid']

    # flatten nested list so we just have a list of the trialdata recorded
    # each time psiturk.recordTrialData(trialdata) was called.
    data_strs = [record['trialdata'] for part in data_strs for record in part]

    # Put all subjects' trial data into a dataframe object from the
    # 'pandas' python library: one option among many for analysis
    return {'main_data': pd.DataFrame(data_strs),
            'aux_data': pd.DataFrame(data_aux)}


if __name__ == "__main__":
    import sys
    data = main(sys.argv[1], sys.argv[2])

    db_name = sys.argv[2].split('/')[-1]

    data['main_data'].to_csv(db_name + '_' + sys.argv[1] + '.tsv', sep='\t')
    data['aux_data'].to_csv(db_name + '_' + sys.argv[1] + '_aux.tsv', sep='\t')
