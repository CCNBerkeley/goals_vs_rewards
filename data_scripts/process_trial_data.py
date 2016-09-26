"""
Main file for processing trial data and creating plots.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from copy import copy
import itertools
import json
import matplotlib
from subprocess import call

import ipdb
ipdb.set_trace()


# Main routine to import the primary csv and do some preliminary parsing
def main(tsv_file):
    data_frame = pd.DataFrame.from_csv(tsv_file, sep="\t")

    # Replace graph-unfriendly values
    data_frame['correct'].replace([False, True], [0., 1.], inplace=True)
    data_frame['reward' ].replace([False, True], [0., 1.], inplace=True)

    uids  = data_frame['uniqueid'].unique()
    heads = ['boxes', 'correct', 'reward', 'response',
             'phase', 'subphase', 'resp_time']

    # Here we loop over the set product of uids with training and test tags.
    for pair in itertools.product(uids, ['train', 'test']):

        # Unpack loop components
        uid   = pair[0]
        phase = pair[1]

        # Set loop component derived vars
        uid_str = str(uid)[0:6]
        col     = 0 if phase == 'train' else 2

        # Let user know progress, useful for debugging.
        # print('-------------------------------------------------------------')
        print('Processing UID: ' + uid_str + ' Phase: ' + phase)
        # print('-------------------------------------------------------------')

        # Prepare figure of subplots if new uid
        if phase == 'train':
            f, axarr = plt.subplots(3, 4, figsize=(22, 12))

        matplotlib.rc('xtick', labelsize=8)
        matplotlib.rc('ytick', labelsize=8)

        # Create masks for extracting test & training data
        user_mask  = data_frame['uniqueid']     == uid
        phase_mask = data_frame[heads]['phase'] == phase

        # Extract test and train subsets
        cur_phase = copy(data_frame[heads][user_mask & phase_mask ])

        # Save them to the to dictionary
        # user_p[uid_str] = cur_phase

        # ----------------------------------------------------------- #
        # Plot the raw 'correct' data
        # ----------------------------------------------------------- #
        too_fast_mask = cur_phase['resp_time'] < 150
        # boolean_correctness = copy(cur_correct)
        cur_correct = copy(cur_phase['correct'])

        cur_correct[cur_correct == 'False'] = 0
        cur_correct[cur_correct == 'True' ] = 1
        cur_correct[cur_correct == '-1'   ] = 0

        indices = range(0, len(cur_correct))
        axarr[0, col].plot(
            indices, cur_correct, 'or', label='Valid')

        indices = range(0, len(cur_correct[too_fast_mask]))
        axarr[0, col].plot(
            indices, cur_correct[too_fast_mask],
            'ob', label='Invalid')

        axarr[0, col].plot()
        axarr[0, col].set_ylim(-0.1, 1.1)
        axarr[0, col].grid()
        axarr[0, col].set_title ('Raw Correctness Data: ' + phase)
        axarr[0, col].set_ylabel('Boolean')
        axarr[0, col].set_xlabel('Box Choice Number')
        axarr[0, col].legend(loc=4)

        # ----------------------------------------------------------- #
        # Compute moving average
        # ----------------------------------------------------------- #
        # Copy subphase-masked 'correct' data
        box_mask = cur_phase['subphase'] == 'boxes'
        cur_corr_series = copy(cur_correct[box_mask & ~too_fast_mask])

        # Compute moving average parameters
        window_len  = 10 if phase == 'train' else 5
        max_low_ind = cur_corr_series.shape[0] - window_len
        avg         = np.empty([max_low_ind, 1])

        # Compute actual moving average
        for low_ind in range(0, max_low_ind):
            high_ind     = low_ind + window_len
            avg[low_ind] = np.mean( cur_corr_series.iloc[low_ind:high_ind] )

        # Plot moving average
        axarr[1, col].plot(avg, color='r', label='all')
        axarr[1, col].set_xlim(0, max_low_ind)
        axarr[1, col].set_ylim(-0.1, 1.1)
        axarr[1, col].grid()
        axarr[1, col].set_title ('Correctness Moving Average: ' + phase)
        axarr[1, col].set_ylabel('Fraction Correct')
        axarr[1, col].set_xlabel('Window Lower Bound')

        # Repeat for seperated point and non-point data
        if (phase == 'train'):
            # 1) First we need to create a mask for point associated boxes.
            point_mask        = cur_phase['subphase'] == 'points'
            point_mask.index  = point_mask.index + 2
            point_mask        = point_mask.iloc[0:-2]
            point_mask.set_value(point_mask.index[0] - 1, False)
            point_mask.set_value(point_mask.index[0] - 2, False)

            point_mask     = point_mask.sort_index()
            point_box_mask = point_mask & box_mask & ~too_fast_mask
            point_corr_series = copy(cur_correct[point_box_mask])

            # 2) Now we can compute a moving average as above.
            window_len  = 10 if phase == 'train' else 5
            max_low_ind = point_corr_series.shape[0] - window_len
            avg         = np.empty([max_low_ind, 1])
            ind         = np.empty([max_low_ind, 1])

            # Compute actual moving average
            ind_zero = cur_corr_series.index[0]
            for low_ind in range(0, max_low_ind):
                high_ind     = low_ind + window_len
                ind[low_ind] = point_corr_series.index[low_ind] - ind_zero
                avg[low_ind] = np.mean(
                                  point_corr_series.iloc[low_ind:high_ind]
                               )

            # Plot moving average
            axarr[1, col].plot(ind, avg, color='b', label='point')

        # Repeat for seperated point and non-point data
        if (phase == 'train'):
            # 1) First we need to create a mask for point associated boxes.
            goal_box_mask = ~point_mask & box_mask & ~too_fast_mask
            goal_corr_series = copy(cur_correct[goal_box_mask])

            # 2) Now we can compute a moving average as above.
            window_len  = 10 if phase == 'train' else 5
            max_low_ind = goal_corr_series.shape[0] - window_len
            avg         = np.empty([max_low_ind, 1])
            ind         = np.empty([max_low_ind, 1])

            # Compute actual moving average
            ind_zero = cur_corr_series.index[0]
            for low_ind in range(0, max_low_ind):
                high_ind     = low_ind + window_len
                ind[low_ind] = goal_corr_series.index[low_ind] - ind_zero
                avg[low_ind] = np.mean(
                                  goal_corr_series.iloc[low_ind:high_ind]
                               )

            # Plot moving average
            axarr[1, col].plot(ind, avg, color='g', label='goal')
            axarr[1, col].legend()

        # ----------------------------------------------------------- #
        # Get response data and code left -> 0, right -> 1
        # ----------------------------------------------------------- #
        codes = [['left', 'right', 'none'], [0, 1, -1]]

        box_resp_series  = copy(cur_phase['response'][box_mask])
        box_resp_series.replace( codes[0], codes[1], inplace=True)

        no_resp_mask = box_resp_series == -1
        num_no_resp  = len(box_resp_series[no_resp_mask])
        prc_no_resp  = num_no_resp / len(box_resp_series)

        plot_note  = 'No resp.: ' + str(num_no_resp) + ', ' \
                    + '%0.2f' % prc_no_resp + '%'

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
        axarr[2, col].text(
            0.5, 0.8, plot_note, transform=axarr[2, col].transAxes)

        if phase == 'train':
            goal_resp_series = copy(cur_phase['response'][~box_mask])
            goal_resp_series.replace(codes[0], codes[1], inplace=True)

            no_resp_mask = goal_resp_series == -1
            num_no_resp  = len(goal_resp_series[no_resp_mask])
            prc_no_resp  = num_no_resp / len(goal_resp_series)

            plot_note  = 'No resp.: ' + str(num_no_resp) + ', ' \
                        + '%0.2f' % prc_no_resp + '%'

            indices = range(0, len(goal_resp_series))
            axarr[2, col].plot(indices, goal_resp_series, '.r', label='Goal')
            axarr[2, col].legend( loc=4 )
            axarr[2, col].text(
                0.5, 0.7, plot_note, transform=axarr[2, col].transAxes)

        # ----------------------------------------------------------- #
        # Plot the response time histogram for this phase
        # ----------------------------------------------------------- #
        # too_fast_mask is defined above in the subsection plotting raw data
        ticks = np.arange(0, 2.2, 0.2)
        n_too_fast = len(cur_phase['resp_time'][too_fast_mask])
        p_too_fast = n_too_fast / len(cur_phase['resp_time'])
        plot_note  = 'Too fast: ' + str(n_too_fast) + ', ' \
                    + '%0.2f' % p_too_fast + '%'

        axarr[0, col+1].hist(cur_phase['resp_time'].dropna()/1000, bins=ticks)
        axarr[0, col+1].grid()
        axarr[0, col+1].set_title ('Response Time Histogram: ' + phase)
        axarr[0, col+1].set_ylabel('Responses in Bin')
        axarr[0, col+1].set_xlabel('Lower Bin Limit [s]')
        axarr[0, col+1].text(
            0.5, 0.9, plot_note, transform=axarr[0, col+1].transAxes)

        # ----------------------------------------------------------- #
        # Create Box-Choice Bar Plots and Moving Averages
        # ----------------------------------------------------------- #
        box_name_list        = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        reward_probabilities = [0.8, 0.2, 0.6, 0.4, 0.8, 0.2, 0.6, 0.4]

        # Extract the box-image associations used.
        # Note: At least one user has submitted the pre-task survey more than
        #       once, resulting in multiple box-image bindings. We always need
        #       to use the 'last' because it represents the final setting.
        raw_box_list = data_frame['box_images'][user_mask].notnull().tolist()
        raw_box_list.reverse()

        # This finds the index of the last non-null value per the note above.
        index = len(raw_box_list) - raw_box_list.index(True) - 1

        box_img_list = copy(data_frame['box_images'][user_mask].iloc[index])
        box_img_list = json.loads(box_img_list.replace('\'', '"'))
        for index in range (0, len(box_img_list)):
            box_img_list[index] = box_img_list[index].split('/')[-1]

        # Moving on...
        if phase == 'train':
            pair_list = ['AB', 'CD', 'EF', 'GH']
        else:
            pair_list = ['AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH',
                               'BC', 'BD', 'BE', 'BF', 'BG', 'BH',
                                     'CD', 'CE', 'CF', 'CG', 'CH',
                                           'DE', 'DF', 'DG', 'DH',
                                                 'EF', 'EG', 'EH',
                                                       'FG', 'FH',
                                                             'GH']

        # There are 3 possible choices per pair displayed:
        # Left, right, or neither, coded 0, 1, -1
        nbins = len(pair_list)
        # nbins = len(pair_list) * 3  #  Old
        choice_bins     = np.zeros(nbins*3)
        choice_bins_qtr = np.zeros([nbins*3, 4])

        # Create the set of labels for the choice bins
        # These will be used shown on the bar plot
        labels = []
        better_item_list = []

        for index in range(0, len(pair_list)):
            box_zero_label = pair_list[index][0]
            box_zero_index = box_name_list.index(box_zero_label)
            box_zero_prob  = reward_probabilities[box_zero_index]

            box_one_label  = pair_list[index][1]
            box_one_index  = box_name_list.index(box_one_label)
            box_one_prob   = reward_probabilities[box_one_index]

            better_item_ind = 1 if box_one_prob > box_zero_prob else 0

            better_item_list.append(better_item_ind)

            labels.append(
                pair_list[index] + ':' + pair_list[index][better_item_ind]
            )
            # labels.append(pair_list[index] + ':' + pair_list[index][1])
            # labels.append(pair_list[index] + ':')

        # Figure out which choice bin to increment and do so
        for index in range(0, len(box_resp_series)):
            choice = box_resp_series.iloc[index]

            disp_pair_str  = cur_phase['boxes'][box_mask].iloc[index]
            disp_pair_list = json.loads(disp_pair_str.replace('\'', '"'))
            disp_pair_inds = [box_img_list.index(disp_pair_list[0] + '.jpg'),
                              box_img_list.index(disp_pair_list[1] + '.jpg')]

            sorted_disp_pair_inds = copy(disp_pair_inds)
            sorted_disp_pair_inds.sort()

            order = 0 if disp_pair_inds == sorted_disp_pair_inds else 1

            disp_pair = box_name_list[sorted_disp_pair_inds[0]] \
                      + box_name_list[sorted_disp_pair_inds[1]]

            disp_list_ind = pair_list.index(disp_pair)

            if choice == -1:
                choice = 2
            else:
                choice = choice if order == 0 else (choice + 1) % 2

            bin_ind = disp_list_ind * 3 + choice
            choice_bins[bin_ind] = choice_bins[bin_ind] + 1

            quarter = int(np.floor( index / (len(box_resp_series) / 4) ))
            choice_bins_qtr[bin_ind][quarter] = choice_bins_qtr[bin_ind][quarter] + 1

        # print('Choice Bins:')
        # print(choice_bins)
        # print(sum(choice_bins))
        # print('')
        # print(choice_bins_qtr)
        # print(sum(choice_bins_qtr))
        # print('')

        better_item_inds = np.arange(0, nbins*3, 3) + better_item_list
        # Normalize the bins
        for low_ind in range(0, nbins*3, 3):
            msk = np.arange(low_ind, low_ind + 3)
            choice_bins[msk] = choice_bins[msk]/sum(choice_bins[msk])

            for clm in range(0, 4):
                norm_fact = sum(choice_bins_qtr[msk, clm])
                choice_bins_qtr[msk, clm] = choice_bins_qtr[msk, clm]/norm_fact

        # print('Normalized Choice Bins')
        # print(choice_bins)
        # print('')
        # print(choice_bins_qtr)
        # print('')

        axarr[1, col+1].bar(
            np.arange(0, nbins),
            choice_bins[better_item_inds],
            tick_label=labels,
            align='center'
            )
        axarr[1, col+1].grid()
        axarr[1, col+1].set_title ('Box Choice Fractions: ' + phase)
        axarr[1, col+1].set_ylabel('% Response Chosen (by Bin)')
        axarr[1, col+1].set_xlabel('Pair Shown : Chosen')
        axarr[1, col+1].set_xlim  (0, nbins)
        axarr[1, col+1].set_ylim  (0, 1)
        plt.setp( axarr[1, col+1].xaxis.get_majorticklabels(), rotation=90)

        # ----------------------------------------------------------- #
        # Plot by-pair performance on for each qtr of training.
        # ----------------------------------------------------------- #
        if (phase == 'train'):
            too_fast_mask = cur_phase['resp_time'] < 150
            # boolean_correctness = copy(cur_correct)
            cur_correct[cur_correct == 'False'] = 0
            cur_correct[cur_correct == 'True' ] = 1
            cur_correct[cur_correct == '-1'   ] = 0

            box_mask = cur_phase['subphase'] == 'boxes'
            cur_mask = box_mask & ~too_fast_mask
            cur_corr_series = copy(cur_correct[cur_mask])

            locs     = np.arange(0, 4)
            n_trials = len(cur_corr_series)
            cutoffs  = np.floor( [n_trials/4, 2*n_trials/4, 3*n_trials/4] )
            cutoffs  = [int(x) for x in cutoffs]

            avg    = np.empty([4, 1])

            avg[0] = np.mean( cur_corr_series.iloc[0         : cutoffs[0]] )
            avg[1] = np.mean( cur_corr_series.iloc[cutoffs[0]: cutoffs[1]] )
            avg[2] = np.mean( cur_corr_series.iloc[cutoffs[1]: cutoffs[2]] )
            avg[3] = np.mean( cur_corr_series.iloc[cutoffs[2]: n_trials  ] )

            wdth = 0.20

            choice_bins_qtr = choice_bins_qtr[better_item_inds, :]
            axarr[2, 1].bar(locs - wdth*2, choice_bins_qtr[0, :], wdth, color='r')
            axarr[2, 1].bar(locs - wdth*1, choice_bins_qtr[1, :], wdth, color='b')
            axarr[2, 1].bar(locs + wdth*0, choice_bins_qtr[2, :], wdth, color='g')
            axarr[2, 1].bar(locs + wdth*1, choice_bins_qtr[3, :], wdth, color='m')

            labels = [labels, labels, labels, labels]
            labels = [item for sublist in labels for item in sublist]

            xticks = [locs - wdth*2, locs - wdth*1, locs + wdth*0, locs + wdth*1]
            xticks = [item for sublist in xticks for item in sublist]
            xticks.sort()

            axarr[2, 1].set_ylim(0, 1)
            axarr[2, 1].grid()
            axarr[2, 1].set_xticks(xticks)
            axarr[2, 1].set_yticks([0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1])
            axarr[2, 1].set_xticklabels(labels)
            axarr[2, 1].set_title ('Quarterly Box Choice Fractions')
            axarr[2, 1].set_ylabel('% Response Chosen (by Bin)')
            axarr[2, 1].set_xlabel('Box Choice by Quarter')
            axarr[2, 1].legend(loc=4)
            plt.setp( axarr[2, 1].xaxis.get_majorticklabels(), rotation=90)

        # ----------------------------------------------------------- #
        # Plot the user "likes" and "dislikes" for box and
        #      goal images.
        # ----------------------------------------------------------- #
        if phase == 'train':
            box_pre_mask  = data_frame[heads]['phase'] == 'box_survey_pre'
            box_post_mask = data_frame[heads]['phase'] == 'box_survey_post'

            goal_pre_mask  = data_frame[heads]['phase'] == 'goal_survey_pre'
            goal_post_mask = data_frame[heads]['phase'] == 'goal_survey_post'

            mask = box_pre_mask | box_post_mask | goal_pre_mask
            mask = (mask | goal_post_mask) & user_mask

            # Extract test and train subsets
            cur_phase = copy(data_frame[['phase', 'response']][mask])
            not_null_mask = cur_phase['response'].notnull()
            non_null_data = cur_phase['response'][not_null_mask]

            goal_eval_pre  = json.loads(non_null_data.iloc[0])
            goal_eval_post = json.loads(non_null_data.iloc[2])

            box_eval_pre   = json.loads(non_null_data.iloc[1])
            box_eval_post  = json.loads(non_null_data.iloc[3])

            evals_pre  = goal_eval_pre  + box_eval_pre
            evals_post = goal_eval_post + box_eval_post

            locs = np.arange(0, len(evals_pre))
            widths = 0.35

            x_tick_labels = ['G1', 'G2', 'G3', 'P0', 'P1',
                                    'A',  'B',  'C',  'D',
                                    'E',  'F',  'G',  'H']

            rects1 = axarr[2, col+3].bar(locs, evals_pre, widths, color='r')
            rects2 = axarr[2, col+3].bar(locs + widths, evals_post, widths)

            axarr[2, col+3].grid()
            axarr[2, col+3].set_title ('Experiment Image Evaluations')
            axarr[2, col+3].set_ylabel('Eval. in [0 (Dislike), 5 (Like)]')
            axarr[2, col+3].set_xlabel('Goal or Box Image')
            axarr[2, col+3].set_xlim  ([0, nbins + 2*widths])
            axarr[2, col+3].set_ylim  ([1, 5])

            axarr[2, col+3].set_yticks([1, 2, 3, 4, 5])
            axarr[2, col+3].set_xticks(locs + widths)
            axarr[2, col+3].set_xticklabels(x_tick_labels)
            axarr[2, col+3].legend((rects1[0], rects2[0]), ('Pre', 'Post'))

        # ----------------------------------------------------------- #
        # Save the figure and close it
        # ----------------------------------------------------------- #
        if phase == 'test':
            # Save the figure
            figname = 'plots_of_uid_' + uid_str + '.png'
            plt.tight_layout()
            plt.savefig(figname, bbox_inches='tight')
            plt.close()


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
        files = 'plots_of_uid_*.png ' + sys.argv[1] + ' process_trial_data.py'
        call([cmd + ' ' + name + ' ' + files], shell=True)
