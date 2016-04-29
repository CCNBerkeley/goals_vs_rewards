from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import query
import json
import pandas as pd
# import pdb
# pdb.set_trace()


def main(table_name):
    # DB program + :// + path from this file to the database
    db_url = "sqlite:///participants.db"

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

    # Column of data to unpack
    data_col_name = 'datastring'

    # Initialize data objects
    data_aux  = []
    data_strs = []

    # Extract table rows. One row should corrospond to one worker's data.
    for row in rows:
        if row['status'] in statuses and row['uniqueid'] not in exclude:
            # Save the data strings to be unpacked
            data_strs.append(row[data_col_name])

            # Save the auxiliary data.
            for key in column_names:
                data_aux.append(row[key])

    # Now we have all participant datastrings in a list.
    # Let's make it a bit easier to work with:
    # parse each participant's datastring as json object
    # and take the 'data' sub-object
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
    return pd.DataFrame(data_strs)


if __name__ == "__main__":
    import sys
    df = main(sys.argv[1])
    df.to_csv(sys.argv[1] + '.tsv', sep='\t')
