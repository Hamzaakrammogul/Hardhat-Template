// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
import "./MEAC.sol";

contract Staking_pool is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct UserRewardInfo {
        uint256 amount;
        uint256 depositAt;
        uint256 canHarvestTimestamp;
        uint256 bonusRate;
        bool isPaid;
    }

    // Info of each user.
    struct UserInfo {
        uint256 amount;         // How many LP tokens the user has provided.
        uint256 rewardDebt;     // Reward debt. See explanation below.
        uint256 doneDays;
        uint256 stakedDays;
        UserRewardInfo[] userRewardInfo;
       
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract.
        uint16 depositFeeBP;      // Deposit fee in basis points
    }

    // The 2LC TOKEN!
    MeacToken public local;
    // 2LC tokens created per block.
    // Bonus muliplier for early local makers.
    uint256 public constant BONUS_MULTIPLIER = 1;
    // Deposit Fee address
    address public feeAddress;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    
    mapping (uint256 => uint256) public bonusRateForTime;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        MeacToken _local,
        address _feeAddress
    ) public {
        local = _local;
        feeAddress = _feeAddress;
        bonusRateForTime[60] = 6;
        bonusRateForTime[90] = 9;
        bonusRateForTime[360] = 70;

        poolInfo.push(PoolInfo({
            lpToken: local,
            depositFeeBP: 0
        }));
    }
    
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(IERC20 _lpToken, uint16 _depositFeeBP) public onlyOwner {
        require(_depositFeeBP <= 10000, "add: invalid deposit fee basis points");
       
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            depositFeeBP: _depositFeeBP
        }));
    }

    // Update the given pool's 2LC allocation point and deposit fee. Can only be called by the owner.
    function set(uint256 _pid, uint16 _depositFeeBP) public onlyOwner {
        require(_depositFeeBP <= 10000, "set: invalid deposit fee basis points");
       
        poolInfo[_pid].depositFeeBP = _depositFeeBP;
    }

    function getBonusRateFromLockedDate(uint256 _days) public view returns (uint256 bonusRate) {
        if (_days >= 60 && _days < 90) {
            bonusRate = bonusRateForTime[60];
        }
        else if (_days >= 90 && _days < 360) {
            bonusRate = bonusRateForTime[90];
        }
        else if (_days >= 360) {
            bonusRate = bonusRateForTime[360];   
        }
    }

    // View function to see pending 2LC on frontend.
    function pendingLocal(uint256 _pid, address _user) public view returns (uint256) {

        UserInfo storage user = userInfo[_pid][_user];
        uint256 pending;
        if (user.amount > 0) {
            uint256 currentTime = block.timestamp;
                for (uint256 i = 0; i < user.userRewardInfo.length; i++ ) {
                    UserRewardInfo storage rewardInfo = user.userRewardInfo[i];
                    if (rewardInfo.isPaid) continue;
                    if (currentTime > rewardInfo.canHarvestTimestamp) {
                        // uint256 lockedDays = block.timestamp.sub(rewardInfo.depositAt);
                        // lockedDays = lockedDays.div(1 days);
                        // uint256 bonusRate = getBonusRateFromLockedDate(lockedDays);
                        uint256 bonusRate= rewardInfo.bonusRate;
                        pending = rewardInfo.amount;
                        pending = pending.add(rewardInfo.amount.mul(bonusRate).div(100));
                    }
                }
        }
        return pending;
    }

    function addOldUsers(address[] memory _walletAddresses, uint256[] memory amounts, uint256[] memory doneDaysList, uint256[] memory stakedDaysList) public onlyOwner() {
        require(_walletAddresses.length == amounts.length, 'different length of list');
        require(_walletAddresses.length == doneDaysList.length, 'different length of list');
        require(_walletAddresses.length == stakedDaysList.length, 'different length of list');
        for (uint256 i = 0; i < _walletAddresses.length; i ++) {
            address _account = _walletAddresses[i];
            UserInfo storage user = userInfo[0][_account];
            uint256 _amount = amounts[i];
            uint256 _doneDays = doneDaysList[i];
            uint256 _stakedDays= stakedDaysList[i];
            user.amount = user.amount.add(_amount);
            user.doneDays= user.doneDays.add(_doneDays);
            user.stakedDays= user.stakedDays.add(_stakedDays);
             if(_doneDays > _stakedDays){
            user.userRewardInfo.push(UserRewardInfo({
                amount: _amount,
                depositAt: block.timestamp.sub(_doneDays * 1 days),
                canHarvestTimestamp: block.timestamp,
                bonusRate: bonusRateForTime[_stakedDays],
                isPaid: false
                }));
        }else{
            uint256 harvestTime= _stakedDays.sub(_doneDays);
            user.userRewardInfo.push(UserRewardInfo({
                amount: _amount,
                depositAt: block.timestamp.sub(_doneDays * 1 days),
                canHarvestTimestamp: block.timestamp.add(harvestTime * 1 days),
                bonusRate: bonusRateForTime[_stakedDays],
                isPaid: false
                }));    
        }
        }
    }

    /*
     *Updated addOldUser function //_amount is the 2LC amount with decimals
     *Added new parameter StakedDays.
     *Both lockedDays and StakeDays Parameter will store in userInfo
     *lockedDays parameter will set DepositAt timestamp 
     *stakedDays parameter will set the canHarvestTimestamp
     **/
    function addOldUser(address _walletAddress, uint256 _amount, uint256 _doneDays,uint256 _stakedDays) public onlyOwner() {
        UserInfo storage user = userInfo[0][_walletAddress];
        user.amount = user.amount.add(_amount);
        user.doneDays= user.doneDays.add(_doneDays);
        user.stakedDays= user.stakedDays.add(_stakedDays);
       
        if(_doneDays > _stakedDays){
        user.userRewardInfo.push(UserRewardInfo({
                amount: _amount,
                depositAt: block.timestamp.sub(_doneDays * 1 days),
                canHarvestTimestamp: block.timestamp,
                bonusRate: bonusRateForTime[_stakedDays],
                isPaid: false
                }));
        }else{
             uint256 harvestTime= _stakedDays.sub(_doneDays);
             user.userRewardInfo.push(UserRewardInfo({
                amount: _amount,
                depositAt: block.timestamp.sub(_doneDays * 1 days),
                canHarvestTimestamp: block.timestamp.add(harvestTime * 1 days),
                bonusRate: bonusRateForTime[_stakedDays],
                isPaid: false
                }));
        }
    }

    // Deposit LP tokens to MasterChef for 2LC allocation.
    function deposit(uint256 _pid, uint256 _amount, uint256 _days) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        // updatePool(_pid);
        if (user.amount > 0) {
            uint256 currentTime = block.timestamp;
            uint256 pending;
            for (uint256 i = 0; i < user.userRewardInfo.length; i++ ) {
                UserRewardInfo storage rewardInfo = user.userRewardInfo[i];
                if (rewardInfo.isPaid) continue;
                
                if (currentTime > rewardInfo.canHarvestTimestamp) {
                    // uint256 lockedDays = block.timestamp.sub(rewardInfo.depositAt);
                    // lockedDays = lockedDays.div(1 days);
                    // uint256 bonusRate = getBonusRateFromLockedDate(lockedDays);
                    uint256 bonusRate= rewardInfo.bonusRate;
                    pending = pending.add(rewardInfo.amount.add(rewardInfo.amount.mul(bonusRate).div(100)));
                    rewardInfo.isPaid = true;
                    rewardInfo.amount = 0;
                    user.amount = user.amount.sub(rewardInfo.amount);
                }
            }

            if(pending > 0) {
                safeLocalTransfer(msg.sender, pending);
            }    
            
        }

        if(_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            uint256 realAmount = _amount;
            if(pool.depositFeeBP > 0){
                uint256 depositFee = _amount.mul(pool.depositFeeBP).div(10000);
                pool.lpToken.safeTransfer(feeAddress, depositFee);
                realAmount = realAmount.sub(depositFee);
            }

            user.amount = user.amount.add(realAmount);
            user.userRewardInfo.push(UserRewardInfo({
                amount: realAmount,
                depositAt: block.timestamp,
                canHarvestTimestamp: block.timestamp.add(_days * 1 days),
                bonusRate: bonusRateForTime[_days],
                isPaid: false
                }));
        }
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    function AuserRewardInfo(uint256 _pid, address account, uint256 index) public view returns (uint256, uint256, uint256, bool) {
        UserInfo storage user = userInfo[_pid][account];
        UserRewardInfo storage rewardInfo = user.userRewardInfo[index];
        return (rewardInfo.amount, rewardInfo.canHarvestTimestamp, rewardInfo.bonusRate, rewardInfo.isPaid);
    }
    
    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
         if (user.amount > 0) {
            uint256 currentTime = block.timestamp;
            uint256 pending;
            uint256 sumAmount;
            uint256 restAmount;
            for (uint256 i = 0; i < user.userRewardInfo.length; i++ ) {
                UserRewardInfo storage rewardInfo = user.userRewardInfo[i];
                if (rewardInfo.isPaid) continue;
                if ( currentTime <= rewardInfo.canHarvestTimestamp ) continue;

                // uint256 lockedDays = block.timestamp.sub(rewardInfo.depositAt);
                // lockedDays = lockedDays.div(1 days);
                // uint256 bonusRate = getBonusRateFromLockedDate(lockedDays);
                uint256 bonusRate= rewardInfo.bonusRate;
                sumAmount = sumAmount.add(rewardInfo.amount);
                if (sumAmount <= _amount){
                    pending = pending.add(rewardInfo.amount.mul(bonusRate).div(100));
                    rewardInfo.isPaid = true;
                    rewardInfo.amount = 0;
                }
                else {
                    restAmount = sumAmount.sub(_amount);
                    pending = pending.add(rewardInfo.amount.sub(restAmount).mul(bonusRate).div(100));
                    rewardInfo.amount = restAmount;
                    break;
                }
            }
            require(pending > 0, "funds still in lock period.");
            user.amount = user.amount.sub(_amount);
            safeLocalTransfer(msg.sender, _amount.add(pending));
        }
    }

    // Safe local transfer function, just in case if rounding error causes pool to not have enough 2LC.
    function safeLocalTransfer(address _to, uint256 _amount) internal {
        uint256 localBal = local.balanceOf(address(this));
        if (_amount > localBal) {
            local.transfer(_to, localBal);
        } else {
            local.transfer(_to, _amount);
        }
    }

    // Update fee address
    function setFeeAddress(address _feeAddress) public {
        require(msg.sender == feeAddress, "setFeeAddress: FORBIDDEN");
        feeAddress = _feeAddress;
    }


    // Shows the count of days since user had staked their Lp tokens
    function userDoneDays(uint256 _pid, address _user) public view returns (uint256 stakedDays){

        UserInfo storage user = userInfo[_pid][_user];
        UserRewardInfo storage rewardInfo = user.userRewardInfo[_pid];
        stakedDays= block.timestamp.sub(rewardInfo.depositAt);
        stakedDays= stakedDays.div(1 days);
        return stakedDays;
    }

    // Shows for how many days users staked the Lp tokens
    function userStakedDays(uint256 _pid, address _user) public view returns (uint256 lockedDays){

        UserInfo storage user = userInfo[_pid][_user];
        lockedDays= user.userRewardInfo[_pid].canHarvestTimestamp.sub(user.userRewardInfo[_pid].depositAt);
        lockedDays= lockedDays.div(1 days);
        return lockedDays;
    }

    // Allow owner to tranfer any BEP20 token from this contract to other addresses 
    function transferERC20(IERC20 token, address to, uint256 amount) external onlyOwner returns (bool) { 

        uint256 bep20balance = token.balanceOf(address(this));
        require(amount <= bep20balance, "balance is low");
        token.transfer(to, amount);
        return true;
    }
 
}