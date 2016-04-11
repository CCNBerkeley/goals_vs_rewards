function [ ] = gen_game_data( )

%-------------------------------------%
% Control variables for this script:
%-------------------------------------%
tolerance  = 0.09;
window_len = 25;
max_consec = 4;

target_dist_ab = 5/6; % ie 10/12
target_dist_cd = 4/6; % ie  8/12

num_min_set_reps = 2;
data_filename = 'game_data.js';
%-------------------------------------%


% Set up governing combinatorial quantities
n_pair_box  = 2;
n_goals     = 3;
n_pair_goal = nchoosek(n_goals,2);
prob_lcd    = 6;

n_ab = n_pair_goal *n_pair_box *prob_lcd;


% Create pre-randomization training set
ab = cell(n_ab,3);
cd = cell(n_ab,3);

order = 1;
for i = 1:n_ab
    ab{i,1} = '"AB"';
    cd{i,1} = '"CD"';
    
    if i <= n_ab * target_dist_ab
        ab{i,2} = 'true';
    else
        ab{i,2} = 'false';
    end
    
    if i <= n_ab * target_dist_cd
        cd{i,2} = 'true';
    else
        cd{i,2} = 'false';
    end
    
    ab{i,3} = order;
    cd{i,3} = order;
    
    if order == -1
        order = 1;
    else
        order = -1;
    end
end

training = repmat([ab;cd],num_min_set_reps,1);


% 'Randomize' the training set, but with conformance to control variables
keep_going  = 1;
while keep_going
    
    % Generate permutation of training set
    train_len = length(training);
    perm      = randperm(train_len);
    training  = training(perm,:);

    % Check this permutation against balance criteria
    [bad_dist,dist_ab,msk] = ...
        check_dist(training,window_len,target_dist_ab,tolerance,'"AB"');
    if bad_dist; continue; end
    
    [bad_cons,cons_ab] = check_cons(msk,max_consec);
    if bad_cons; continue; end
    
    [bad_dist,dist_cd,msk] = ...
        check_dist(training,window_len,target_dist_cd,tolerance,'"CD"');
    if bad_dist; continue; end
    
    [bad_cons,cons_cd] = check_cons(msk,max_consec);
    if bad_cons; continue; end
    
    % If the checks were passed, don't keep checking permuations.
    keep_going = 0;
end


% Plot the training set characteristics
subaxis(2,2,1)
plot(dist_ab,'-o')
title('Moving Avg. Reward Dist: AB')

subaxis(2,2,2)
plot(cons_ab,'-o')
title('Consecutive Instances of Choice: AB')

subaxis(2,2,3)
plot(dist_cd,'-o')
title('Moving Avg. Reward Dist: CD')

subaxis(2,2,4)
plot(cons_cd,'-o')
title('Consecutive Instances of Choice: CD')


% Create the test set
test = { ...
 '"AB"', 'true', 1; ...
 '"AC"', 'true', 1; ...
 '"AD"', 'true', 1; ...
 '"BC"', 'true', 1; ...
 '"BD"', 'true', 1; ...
 '"CD"', 'true', 1; ...
...
 '"AB"', 'true', -1; ...
 '"AC"', 'true', -1; ...
 '"AD"', 'true', -1; ...
 '"BC"', 'true', -1; ...
 '"BD"', 'true', -1; ...
 '"CD"', 'true', -1; ...
 };

test = repmat(test,5,1);
perm = randperm(5*2*6);
test = test(perm,:);

% ToDo: Need to balance the test set in ways similar to training set




% Write the data set to a game_data.js file
fileID = fopen(data_filename,'w');
fprintf(fileID,'%s','var train_set = [');

train_len = length(training);
for i=1:train_len
    object_str = [          '{boxes:'         training{i,1} ','];
    object_str = [object_str 'yield:'         training{i,2}  ','];
    object_str = [object_str 'order:' num2str(training{i,3}) '}'];
    fprintf(fileID,'%s',object_str);
    
    if i < train_len
        fprintf(fileID,'%s',',');
    end
end
fprintf(fileID,'%s\r\n','];');
fprintf(fileID,'%s','var test_set = [');

test_len = length(test);
for i=1:test_len
    object_str = [          '{boxes:'         test{i,1} ','];
    object_str = [object_str 'yield:'         test{i,2}  ','];
    object_str = [object_str 'order:' num2str(test{i,3}) '}'];
    fprintf(fileID,'%s',object_str);
    
    if i < test_len
        fprintf(fileID,'%s',',');
    end
end
fprintf(fileID,'%s',']');
fclose(fileID);

end


function [bad_dist_flg,rew_dist,mask_str] = check_dist(training,dist_len,dist_aim,dist_bnd,string)
    
    bad_dist_flg = 0;
    
    mask_str = strcmp(training(:,1),string);
    subset   = training(mask_str,:);
    set_len  = sum(mask_str);
    rew_dist = NaN(1,set_len-dist_len);
    
    % Cycle through the training set, masking out a windows and checking if
    % they have distributions within the proper bounds
    for i=1:set_len-dist_len
        windowed    = subset(i:i+dist_len-1,:);
        mask_true   = strcmp(windowed(:,2),'true');
        dist        = sum(mask_true)/dist_len;
        rew_dist(i) = dist;
        
        if abs(dist-dist_aim) > dist_bnd
            bad_dist_flg = 1;
            break
        end
    end
end

function [bad_cons,big_cons] = check_cons(mask,max_cons)

    cons     = 0;
    bad_cons = 0;
    mask_len = length(mask);
    big_cons = NaN(1,mask_len);
    
   for i = 1:mask_len
       if mask(i) == 1
           cons = cons + 1;
       else
           cons = 0;
       end

       big_cons(i) = cons;

       if cons > max_cons
            bad_cons = 1;
           break
       end
   end
end
