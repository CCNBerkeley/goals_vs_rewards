function [ ] = gen_game_data( )
%GEN_GAME_DATA Summary of this function goes here
%   Detailed explanation goes here

ab = cell(36,3);
cd = cell(36,3);

order = 1;
for i = 1:180 % 36*5 which is divisible by 36,8, and 6;
    ab{i,1} = '"AB"';
    cd{i,1} = '"CD"';
    
    if i <= 144 % 80% of 180
        ab{i,2} = 'true';
    else
        ab{i,2} = 'false';
    end
    
    if i <= 108 % 60% of 180
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

training = [ab ; cd];

clear ab
clear bc

keep_going = 1;
dist_bnd   = 0.2;
dist_len   = 30;
max_consec = 5;

while keep_going
    perm = randperm(360);
    training = training(perm,:);

    [bad_dist,dist_ab,msk] = check_dist(training,dist_len,0.8,dist_bnd,'"AB"');
    if bad_dist; continue; end
    
    [bad_cons,cons_ab] = check_cons(msk,max_consec);
    if bad_cons; continue; end
    
    [bad_dist,dist_cd,msk] = check_dist(training,dist_len,0.6,dist_bnd,'"CD"');
    if bad_dist; continue; end
    
    [bad_cons,cons_cd] = check_cons(msk,max_consec);
    if bad_cons; continue; end
    
    keep_going = 0;
end

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

fileID = fopen('game_data.js','w');
fprintf(fileID,'%s','var train_set = [');
for i=1:360
    object_str = [          '{boxes:'         training{i,1} ','];
    object_str = [object_str 'yield:'         training{i,2}  ','];
    object_str = [object_str 'order:' num2str(training{i,3}) '}'];
    fprintf(fileID,'%s',object_str);
    
    if i < 360
        fprintf(fileID,'%s',',');
    end
end
fprintf(fileID,'%s\r\n','];');
fprintf(fileID,'%s','var test_set = [');

for i=1:5*2*6
    object_str = [          '{boxes:'         test{i,1} ','];
    object_str = [object_str 'yield:'         test{i,2}  ','];
    object_str = [object_str 'order:' num2str(test{i,3}) '}'];
    fprintf(fileID,'%s',object_str);
    
    if i < 5*2*6
        fprintf(fileID,'%s',',');
    end
end
fprintf(fileID,'%s',']');
fclose(fileID);

end


function [bad_dist,big_dist,mask_str] = check_dist(training,dist_len,dist_aim,dist_bnd,string)
    bad_dist = 0;
    big_dist = NaN(1,180-dist_len);
   
    mask_str  = strcmp(training(:,1),string);
    low_ind  = find(mask_str == 1,1);
    high_ind = find(cumsum(mask_str) == dist_len,1);
    
    i = 0;
    for i=1:180-dist_len
        %i = i + 1;
        recent_mask_str = mask_str(low_ind:high_ind);
        recent_training = training(low_ind:high_ind,:);
        recent_str      = recent_training(recent_mask_str,:);
        mask_true       = strcmp(recent_str(:,2),'true');
        dist            = sum(mask_true)/dist_len;
        big_dist(i)     = dist;
        
        if abs(dist-dist_aim) > dist_bnd
            bad_dist = 1;
            break
        end
        
        low_ind = find(mask_str(low_ind+1:end) == 1,1) + low_ind;
        high_ind = find(cumsum(mask_str(low_ind:end,:)) == dist_len,1) + low_ind - 1;
    end
end

function [bad_cons,big_cons] = check_cons(mask,max_cons)

    cons     = 0;
    bad_cons = 0;
    big_cons = NaN(1,360);
    
   for i = 1:360
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
