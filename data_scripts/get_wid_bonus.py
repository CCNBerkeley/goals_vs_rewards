import pandas as pd
#import pdb
#pdb.set_trace()

def main(tsv_name):
   data_frame = pd.DataFrame.from_csv(tsv_name, sep="\t")
   data_frame = data_frame[['bonus', 'uniqueid']]

   null_mask  = data_frame['bonus'].isnull()
   data_frame = data_frame[~null_mask]
   
   ids = data_frame['uniqueid'].tolist()
   bonuses = data_frame['bonus'].tolist()

   for id_num in range(0,len(ids)):
      print('WorkerID: ', ids[id_num].split(':')[0], ' Bonus: ', bonuses[id_num])

if __name__ == "__main__":
    import sys
    main(sys.argv[1])
