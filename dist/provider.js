"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthersProvider = void 0;
const abi_1 = require("@ethersproject/abi");
const ethers_1 = require("ethers");
const Multicall_json_1 = __importDefault(require("./Multicall.json"));
const multicallAddresses = {
    mainnet: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
    ropsten: '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
    polygon: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507',
};
const networks = {
    mainnet: {
        chainId: ethers_1.ethers.utils.hexValue(1),
        chainName: 'Ethereum Mainet',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io'],
    },
    ropsten: {
        chainId: ethers_1.ethers.utils.hexValue(3),
        chainName: 'Ropsten',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ropsten.infura.io'],
    },
    polygon: {
        chainId: ethers_1.ethers.utils.hexValue(137),
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-mainnet.matic.network'],
    },
    local: {
        chainId: ethers_1.ethers.utils.hexValue(1337),
        chainName: 'localhost',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['http://localhost:8545'],
    },
};
const CACHED_PROVIDER_KEY = 'ethers_cached_provider';
class EthersProvider extends EventTarget {
    constructor(options) {
        super();
        this.connecting = false;
        this.desiredNetwork = (options === null || options === void 0 ? void 0 : options.network) || 'mainnet';
        this.rpcTokens = (options === null || options === void 0 ? void 0 : options.rpcTokens) || null;
        this.connectors = Object.assign({ metamask: () => __awaiter(this, void 0, void 0, function* () {
                // @ts-ignore
                const provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum, 'any');
                yield provider.send('eth_requestAccounts', []);
                return provider;
            }) }, options === null || options === void 0 ? void 0 : options.connectors);
        this.multicallAddresses = Object.assign(Object.assign({}, multicallAddresses), options === null || options === void 0 ? void 0 : options.customMulticalls);
        this.provider = null;
        this.mainAccount = null;
        this.providerType = null;
        this.switchingNetwork = null;
        this.restoreCachedProvider();
    }
    connectProvider(providerType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.setConnecting(true);
                if (!Object.keys(this.connectors).includes(providerType)) {
                    throw new Error(`no connector provided for ${providerType}`);
                }
                const provider = yield this.connectors[providerType]();
                this.setProvider(providerType, provider);
            }
            finally {
                this.setConnecting(false);
            }
        });
    }
    disconnectProvider() {
        this.provider = null;
        this.mainAccount = null;
        this.dispatchEvent(new CustomEvent('changeProvider', { detail: null }));
        this.dispatchEvent(new CustomEvent('changeMainAccount', { detail: null }));
        this.removeCachedProvider();
    }
    setProvider(providerType, provider) {
        this.providerType = providerType;
        this.provider = provider;
        provider
            .listAccounts()
            .then(accounts => {
            this.mainAccount = accounts[0];
            this.dispatchEvent(new CustomEvent('changeProvider', { detail: provider }));
            this.dispatchEvent(new CustomEvent('changeMainAccount', { detail: this.mainAccount }));
        })
            .catch(() => {
            this.providerType = null;
            this.provider = null;
        });
        this.setCachedProvider(providerType);
    }
    getProvider(network) {
        return network === 'local' || (!network && (!this.desiredNetwork || this.desiredNetwork === 'local'))
            ? new ethers_1.ethers.providers.JsonRpcProvider('http://localhost:8545')
            : ethers_1.ethers.getDefaultProvider(network || this.desiredNetwork, this.rpcTokens);
    }
    getSigner(network) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.provider) {
                throw new Error('wallet not connected');
            }
            const provider = this.provider;
            const networkParams = networks[network || this.desiredNetwork];
            const currentNetwork = yield (provider === null || provider === void 0 ? void 0 : provider.getNetwork());
            const currentNetworkChainId = ethers_1.ethers.utils.hexValue((currentNetwork === null || currentNetwork === void 0 ? void 0 : currentNetwork.chainId) || -1);
            if (provider) {
                yield this.switchingNetwork;
                if (currentNetworkChainId !== networkParams.chainId) {
                    if (!provider.provider || !provider.provider.request) {
                        throw new Error('metamask provider missing');
                    }
                    try {
                        this.switchingNetwork = provider.provider.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: networkParams.chainId }],
                        });
                        yield this.switchingNetwork;
                    }
                    catch (error) {
                        // @ts-ignore
                        if (error.code === 4902) {
                            // chain not installed
                            yield provider.provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [networkParams],
                            });
                            // @ts-ignore
                        }
                        else if (error.code === -32002) {
                            yield this.switchingNetwork;
                        }
                        else {
                            throw error;
                        }
                    }
                }
                const newNetwork = yield provider.getNetwork();
                const newChainId = ethers_1.ethers.utils.hexValue(newNetwork.chainId);
                if (newChainId !== networkParams.chainId) {
                    throw new Error('could not set new network! Set network to Localhost manually.');
                }
            }
            return provider.getSigner();
        });
    }
    multicall(network, abi, calls) {
        return __awaiter(this, void 0, void 0, function* () {
            const multicallAddress = this.multicallAddresses[network];
            if (!multicallAddress) {
                throw new Error(`no multicall contract registered for network ${network}`);
            }
            const provider = this.getProvider(network);
            const multicall = new ethers_1.ethers.Contract(multicallAddress, Multicall_json_1.default.abi, provider);
            const contractInterface = new abi_1.Interface(abi);
            const multicallCalls = calls.map(c => ({
                target: c.target,
                callData: contractInterface.encodeFunctionData(c.functionName, c.functionArguments),
            }));
            const multicallResult = yield multicall.aggregate(multicallCalls);
            const functionResults = multicallResult[1];
            return calls.map((c, i) => contractInterface.decodeFunctionResult(c.functionName, functionResults[i]));
        });
    }
    get connected() {
        return !!this.provider;
    }
    setConnecting(value) {
        this.connecting = value;
        this.dispatchEvent(new CustomEvent('connecting', { detail: value }));
    }
    setCachedProvider(providerType) {
        if (typeof window !== 'undefined' && 'localStorage' in window) {
            window.localStorage.setItem(CACHED_PROVIDER_KEY, providerType);
        }
    }
    restoreCachedProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window !== 'undefined' && 'localStorage' in window) {
                const cachedProviderType = window.localStorage.getItem(CACHED_PROVIDER_KEY);
                if (cachedProviderType) {
                    try {
                        yield this.connectProvider(cachedProviderType);
                    }
                    catch (_a) {
                        this.removeCachedProvider();
                    }
                }
            }
        });
    }
    removeCachedProvider() {
        if (typeof window !== 'undefined' && 'localStorage' in window) {
            window.localStorage.removeItem(CACHED_PROVIDER_KEY);
        }
    }
}
exports.EthersProvider = EthersProvider;
//# sourceMappingURL=provider.js.map