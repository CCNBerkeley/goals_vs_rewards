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

full = [ab; cd];
full = full(perm,:);

end

