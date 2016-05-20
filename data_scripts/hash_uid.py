import pandas as pd

def main(tsv_name):
   data_frame = pd.DataFrame.from_csv(tsv_name, sep="\t")

   uids = data_frame['uniqueid'].unique()
   for item in uids:
      data_frame['uniqueid'].replace(item, str(hash(item)), inplace=True)
      print('UniqueID and Hash: ', item, hash(item))

   return data_frame

if __name__ == "__main__":
    import sys
    df = main(sys.argv[1])

    df.to_csv(sys.argv[1] + '_uid_hashed.tsv', sep='\t')
