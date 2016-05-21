# Plot things in notebook window
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import copy
import itertools

from subprocess import call

import ipdb
ipdb.set_trace()


# Main routine to import the primary csv and do some preliminary parsing
def main(tsv_file):
    data_frame = pd.DataFrame.from_csv(tsv_file, sep="\t")

    # Replace graph-unfriendly values
    data_frame['correct'].replace([False, True], [0., 1.], inplace=True)
    data_frame['reward' ].replace([False, True], [0., 1.], inplace=True)

    #
    uids  = data_frame['uniqueid'].unique()
    heads = ['correct', 'reward', 'response', 'phase', 'subphase', 'resp_time']
    for pair in itertools.product(uids, ['train', 'test']):

        # Unpack loop components
        uid     = pair[0]
        phase   = pair[1]

        # Set loop component derivatived vars
        uid_str = str(uid)[0:6]
        col     = 0 if phase == 'train' else 1

        # Prepare figure of subplots if new uid
        if phase == 'train':
            f, axarr = plt.subplots(4, 2, figsize=(9, 16))

        # Create masks for extracting test & training data
        user_mask  = data_frame['uniqueid']         == uid
        phase_mask = data_frame[heads]['phase'] == phase

        # Extract test and train subsets
        cur_phase = copy.copy(data_frame[heads][user_mask & phase_mask ])

        # Save them to the to dictionary
        # user_p[uid_str] = cur_phase

        # Plot the raw 'correct' data
        indices = range(0, len(cur_phase['correct']))
        axarr[0, col].plot(indices, cur_phase['correct'], 'or')
        axarr[0, col].set_ylim(-0.1, 1.1)
        axarr[0, col].grid()
        axarr[0, col].set_title ('Raw Correctness Data: ' + phase)
        axarr[0, col].set_ylabel('Boolean')
        axarr[0, col].set_xlabel('Box Choice Number')

        # Copy subphase-masked 'correct' data
        box_mask = cur_phase['subphase'] == 'boxes'
        cur_corr_series = copy.copy(cur_phase['correct'][box_mask])

        # Compute moving average parameters
        window_len  = 10 if phase == 'train' else 5
        max_low_ind = cur_corr_series.shape[0] - window_len
        avg         = np.empty([max_low_ind, 1])

        # Compute actual moving average
        for low_ind in range(0, max_low_ind):
            high_ind     = low_ind + window_len
            avg[low_ind] = np.mean( cur_corr_series.iloc[low_ind:high_ind] )

        # Plot moving average
        axarr[1, col].plot(avg, 'or')
        axarr[1, col].set_xlim(0, max_low_ind)
        axarr[1, col].set_ylim(-0.1, 1.1)
        axarr[1, col].grid()
        axarr[1, col].set_title ('Correctness Moving Average: ' + phase)
        axarr[1, col].set_ylabel('Fraction Correct')
        axarr[1, col].set_xlabel('Window Lower Bound')

        # Get response data and code left -> 0, right -> 1
        codes = [['left', 'right', 'none'], [0., 1., -1.0]]

        box_resp_series  = copy.copy(cur_phase['response'][ box_mask])
        box_resp_series.replace( codes[0], codes[1], inplace=True)

        indices = range(0, len(box_resp_series))
        if phase == 'train':
            axarr[2, col].plot(indices, box_resp_series, '.b', label='Box')
        else:
            axarr[2, col].plot(indices, box_resp_series, '.b')

        axarr[2, col].set_ylim(-1.1, 1.1)
        axarr[2, col].set_xlim(0, indices[-1])
        axarr[2, col].grid()
        axarr[2, col].set_title ('Coded Subject Responses: ' + phase)
        axarr[2, col].set_ylabel('None(-1), Left(0), Right(1)')
        axarr[2, col].set_xlabel('Response Number')

        if phase == 'train':
            goal_resp_series = copy.copy(cur_phase['response'][~box_mask])
            goal_resp_series.replace(codes[0], codes[1], inplace=True)

            indices = range(0, len(goal_resp_series))
            axarr[2, col].plot(indices, goal_resp_series, '.r', label='Goal')
            axarr[2, col].legend( loc=4 )

        # Plot the response time empirical pdf for this phase
        axarr[3, col].hist(cur_phase['resp_time'].dropna())
        axarr[3, col].grid()
        axarr[3, col].set_title ('Response Time Histogram: ' + phase)
        axarr[3, col].set_ylabel('Responses in Bin')
        axarr[3, col].set_xlabel('Lower Bin Limit')

        if phase == 'test':
            # Save the figure
            plt.tight_layout()
            plt.savefig('uid_' + uid_str + '_plots.png', bbox_inches='tight')
            plt.clf()


# Send system arguments to main:
if __name__ == "__main__":
    import sys
    import time

    # Run the actual data processing
    main(sys.argv[1])

    # Package it if that was an argument
    if (len(sys.argv[:]) > 2 and sys.argv[2] == '--package'):
        cmd   = 'zip -j'
        dstr  = time.strftime("%y_%m_%d")
        name  = 'plots_' + dstr
        files = 'uid_*_plots.png ' + sys.argv[1] + ' process_trial_data.py'
        call([cmd + ' ' + name + ' ' + files], shell=True)
