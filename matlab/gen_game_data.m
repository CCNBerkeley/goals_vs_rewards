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

perm = randperm(360);

training = [ab; cd];
training = training(perm,:);

clear ab
clear bc

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

