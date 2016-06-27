function [ ] = gen_game_data(cond_num)   

[perm,test_perm,training,test] = gen_test_train_data(cond_num, {'A', 'B', 'C', 'D'}, '_goal');

[~,~,point_training, point_test] = ...
   gen_test_train_data(cond_num, {'E', 'F', 'G', 'H'}, '_point', perm, test_perm);

box_names = {'A','B','C','D'; 'E', 'F','G','H'};
addnl_test_combos = { ...
    ['"' box_names{1,1} box_names{2,1} '"'], 'true', 1; ...
    ['"' box_names{1,1} box_names{2,2} '"'], 'true', 1; ...
    ['"' box_names{1,1} box_names{2,3} '"'], 'true', 1; ...
    ['"' box_names{1,1} box_names{2,4} '"'], 'true', 1; ...
    ...
    ['"' box_names{1,2} box_names{2,1} '"'], 'true', 1; ...
    ['"' box_names{1,2} box_names{2,2} '"'], 'true', 1; ...
    ['"' box_names{1,2} box_names{2,3} '"'], 'true', 1; ...
    ['"' box_names{1,2} box_names{2,4} '"'], 'true', 1; ...
    ...
    ['"' box_names{1,3} box_names{2,1} '"'], 'true', 1; ...
    ['"' box_names{1,3} box_names{2,2} '"'], 'true', 1; ...
    ['"' box_names{1,3} box_names{2,3} '"'], 'true', 1; ...
    ['"' box_names{1,3} box_names{2,4} '"'], 'true', 1; ...
    ...
    ['"' box_names{1,4} box_names{2,1} '"'], 'true', 1; ...
    ['"' box_names{1,4} box_names{2,2} '"'], 'true', 1; ...
    ['"' box_names{1,4} box_names{2,3} '"'], 'true', 1; ...
    ['"' box_names{1,4} box_names{2,4} '"'], 'true', 1; ...
 };

addnl_test_combos = repmat(addnl_test_combos,3,1);

train_len = size(training,1);
test_len  = size(test    ,1);

condition_len = train_len + test_len;

condition_indicator = [ones(train_len,1); zeros(train_len,1); ...
                       ones(test_len ,1); zeros(test_len ,1)];
train_set_indicator = [ones(train_len,1); zeros(train_len,1)];
test_set_indicator  = [ones(test_len ,1); zeros(test_len ,1)];

keep_iterating = 1;
while keep_iterating
   keep_iterating = 0;
   train_perm = randperm(2*train_len);
   test_perm  = randperm(2*test_len ) + 2*train_len;
   
   permutation = [train_perm, test_perm];
   condition_indicator = condition_indicator(permutation,:);
   
   one_streak  = 0;
   zero_streak = 0;
   for i = 1:train_len
      if condition_indicator(i)
         one_streak  = one_streak + 1;
         zero_streak = 0;
      else
         one_streak  = 0;
         zero_streak = zero_streak + 1;
      end
      if one_streak == 6 || zero_streak == 6;
         keep_iterating = 1;
         break
      end
   end
   
end

condition_indicator = condition_indicator(permutation,:);

j = 1;
k = 1;
new_train = cell(2*train_len,3);
for i = 1:2*train_len
   if condition_indicator(i)
      new_train(i,:) = training(j,:);
      j = j + 1;
   else
      new_train(i,:) = point_training(k,:);
      k = k + 1;
   end
end

j = 1;
k = 1;
new_test = cell(2*test_len,3);
for i = 1:2*test_len
   if condition_indicator(2*train_len + i)
      new_test(i,:) = test(j,:);
      j = j + 1;
   else 
      new_test(i,:) = point_test(k,:);
      k = k + 1;
   end
end

permutation = randperm(16*3);
addnl_test_combos = addnl_test_combos(permutation,:);
new_test = [new_test; addnl_test_combos];

filename = ['condition_' num2str(cond_num) '_data'];
write_game_data(filename, new_train, new_test)

end

function [] = write_game_data(filename, training, test)

fileID = fopen([filename '.json'],'w');
fprintf(fileID,'%s','{"train_set": [');

train_len = length(training);
for i=1:train_len
    object_str = [          '{"boxes":'         training{i,1} ','];
    object_str = [object_str '"yield":'         training{i,2}  ','];
    object_str = [object_str '"order":' num2str(training{i,3}) '}'];
    fprintf(fileID,'%s',object_str);
    
    if i < train_len
        fprintf(fileID,'%s',',');
    end
end
fprintf(fileID,'%s\r\n','],');
fprintf(fileID,'%s','"test_set": [');

test_len = length(test);
for i=1:test_len
    object_str = [          '{"boxes":'         test{i,1} ','];
    object_str = [object_str '"yield":'         test{i,2}  ','];
    object_str = [object_str '"order":' num2str(test{i,3}) '}'];
    fprintf(fileID,'%s',object_str);
    
    if i < test_len
        fprintf(fileID,'%s',',');
    end
end
fprintf(fileID,'%s',']}');
fclose(fileID);

end

function [perm,test_perm,training,test] = gen_test_train_data(cond_num, box_names, suffix, varargin)

%-------------------------------------%
% Control variables for this script:
%-------------------------------------%
tolerance  = 0.09;
window_len = 25;
max_consec = 4;

target_dist_ab = 5/6; % ie 10/12
target_dist_cd = 4/6; % ie  8/12

num_min_set_reps = 2;
filename = ['condition_' num2str(cond_num) suffix '_data'];
%-------------------------------------%


% Set up governing combinatorial quantities
n_pair_box  = 2;
n_goals     = 3;
n_pair_goal = nchoosek(n_goals,2);
prob_lcm    = 6;

n_ab = n_pair_goal *n_pair_box *prob_lcm;


% Create pre-randomization training set
ab = cell(n_ab,3);
cd = cell(n_ab,3);

pair_name_1 = ['"' box_names{1} box_names{2} '"'];
pair_name_2 = ['"' box_names{3} box_names{4} '"'];

order = 1;
for i = 1:n_ab
    ab{i,1} = pair_name_1;
    cd{i,1} = pair_name_2;
    
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
iter = 1;
while keep_going    
    % Generate permutation of training set
    train_len = length(training);
    
    if nargin == 5 && iter == 1
       perm = varargin{1};
    elseif nargin == 5 && iter > 1
       error('Error from line 74: Supplied permutation did not pass check...')
    else
       perm = randperm(train_len);
    end
    
    new_training = training(perm,:);

    % Check this permutation against balance criteria
    [bad_dist,dist_ab,msk] = ...
        check_dist(new_training,window_len,target_dist_ab,tolerance,pair_name_1);
    if bad_dist; continue; end
    
    [bad_cons,cons_ab] = check_cons(msk,max_consec);
    if bad_cons; continue; end
    
    [bad_dist,dist_cd,msk] = ...
        check_dist(new_training,window_len,target_dist_cd,tolerance,pair_name_2);
    if bad_dist; continue; end
    
    [bad_cons,cons_cd] = check_cons(msk,max_consec);
    if bad_cons; continue; end
    
    % If the checks were passed, don't keep checking permuations.
    keep_going = 0;
    iter = iter + 1;
end

training = new_training;

% Plot the training set characteristics
spacing = 0.03;
padding = 0.03;
margin  = 0.03;
marginB = 0.03;

figure();
set(gcf,'Position',[42,54,1026,746])

subaxis(2,2,1,'S',spacing,'P',padding,'M',margin,'MB',marginB)
plot(dist_ab,'-o')
title(['\bf{Moving Avg. Reward Dist: ' pair_name_1 '}'])

subaxis(2,2,2,'S',spacing,'P',padding,'M',margin,'MB',marginB)
plot(cons_ab,'-o')
title(['\bf{Consecutive Instances of Choice: ' pair_name_1 '}'])

subaxis(2,2,3,'S',spacing,'P',padding,'M',margin,'MB',marginB)
plot(dist_cd,'-o')
title(['\bf{Moving Avg. Reward Dist: ' pair_name_2 '}'])

subaxis(2,2,4,'S',spacing,'P',padding,'M',margin,'MB',marginB)
plot(cons_cd,'-o')
title(['\bf{Consecutive Instances of Choice: ' pair_name_2 '}'])

figname = [filename '.jpg'];
export_fig(figname)

% Create the test set
test = { ...
    pair_name_1                        , 'true', 1; ...
    ['"' box_names{1} box_names{3} '"'], 'true', 1; ...
    ['"' box_names{1} box_names{4} '"'], 'true', 1; ...
    ['"' box_names{2} box_names{3} '"'], 'true', 1; ...
    ['"' box_names{2} box_names{4} '"'], 'true', 1; ...
    pair_name_2                        , 'true', 1; ...
...
    pair_name_1                        , 'true', -1; ...
    ['"' box_names{1} box_names{3} '"'], 'true', -1; ...
    ['"' box_names{1} box_names{4} '"'], 'true', -1; ...
    ['"' box_names{2} box_names{3} '"'], 'true', -1; ...
    ['"' box_names{2} box_names{4} '"'], 'true', -1; ...
    pair_name_2                        , 'true', -1; ...
 };

test      = repmat(test,3,1);

if nargin == 5
   test_perm = varargin{2};
else
   test_perm = randperm(3*2*6);
end

test = test(test_perm,:);

% ToDo: Need to balance the test set in ways similar to training set




% Write the data set to a game_data.js file
write_game_data(filename, training, test)

save(['condition_' num2str(cond_num) suffix '_data.mat'])

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
