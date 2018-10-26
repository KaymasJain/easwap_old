// hiding boxes in ropsten
var isRopsten = false;
var faucetLink;
function forRopsten() {
    isRopsten = true;
    Object.keys(coinsData).forEach(function (key, i) {
        if (!coinsData[key].rop) {
            var forClass = `.${coinsData[key].id}ForColor`;
            $(forClass).css('display', 'none');
        }
    });
    kyber = ropsData;
    if (!faucetLink) {
        faucetLink = `<div id="faucetEth">Get free ETH for ropsten from <a href="https://faucet.metamask.io/" target="_blank" class="footerLink">Metamask's</a> and <a href="https://faucet.kyber.network/" target="_blank" class="footerLink">Kyber Network's</a> faucet</div>`
        $('.mainBody').append(faucetLink);
    }
}

var onMain = false;
var account;
var providerName;

window.addEventListener('load', async () => {
    if (window.ethereum) {
        var web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
            // Acccounts now exposed
            getAccountAndNetwork(web3);
        } catch (error) {
            // User denied account access...
            console.log(error);
        }
        console.log(1);
    } else if (window.web3) {
        console.log(2);
        var web3 = new Web3(web3.currentProvider);
        getAccountAndNetwork(web3);
    } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
});

function getAccountAndNetwork(web3) {
    web3.version.getNetwork((err, netId) => {
        account = web3.eth.accounts[0];
        networkId = netId; // networkId defined in fire.js
        if (account) {
            var stringLen = account.length;
            var text = `${account.slice(0, 6)}...${account.slice(stringLen-4, stringLen)}`;
            console.log(account);
            if (netId == 1) {
                $('.loggedInWith').text('Main Network');
                var link = `<a class="etherLink" target='_blank' href='https://etherscan.io/address/${account}'>${text}</a>`;
                $('.yourAddr').empty().append(link);
                $('.loggedInWith').css('background-color', 'var(--blue-for-hover-op5)');
                $('.tryMainOrRop').hide();
                onMain = true;
            } else if (netId == 3) {
                $('.loggedInWith').text('Ropsten Test Net');
                var link = `<a class="etherLink" target='_blank' href='https://ropsten.etherscan.io/address/${account}'>${text}</a>`;
                $('.yourAddr').empty().append(link);
                var toolTipText = `Ready for main net?<span class="tryNetText">For real asset trading just shift to main net</span>`
                $('.tryMainOrRop').empty().append(toolTipText);
                onMain = true;
                forRopsten();
            } else {
                $('.loggedInWith').text('Not Main Net');
                $('.yourAddr').text('shift to main');
            }
        } else {
            $('.yourAddr').text('Not logged-In');
        }
    });
}














// For defining expectedRate function from smart contract
var mainKyberAdd = '0x818E6FECD516Ecc3849DAf6845e3EC868087B755';
var mainKyberContract = web3.eth.contract(kyberMainABI).at(mainKyberAdd);

mainKyberContract.enabled(function (err, res) {
    if (!err) {
        if (!res && !networkId) {
            if (networkId == 1 || networkId == 3) {
                var title = 'CONTRACT UNDER CONSTRUCTION';
                var content = 'kyber network contract under construction. Please come back later.';
                showAlert(title, content);
            }
        }
    } else {
        var title = 'UNEXPECTED ERROR';
        var content = 'Try reloading again!';
        showAlert(title, content);
        console.log(err);
    };
});
