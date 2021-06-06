import { useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { fetchStateAccountInfo } from '../lib/solana';
import Layout from '../components/AppLayout';
import NotificationPanel from '../components/NotificationPanel';

const PUBLISHER_PATH=process.env.NEXT_PUBLIC_PUBLISHER_PATH

const stateAcctStr = 'H2rMQHUe6mhEPg3hAjVG2Y2sbJcUxWbbc5SS8wR1B52p';
const sharedAcctStr = '24VP4P6WNdzvF76ZascNEmBi7jSxhkju3Ga5N3E2P2hf'

export default function Profile() {

  // State Account state
  const [stateAcct, setStateAcct] = useState('5Y9Mcod7JwhfPCiLXgzNbGGuAijq5s4dNQG8VQjD3kMX');
  const [sharedAcct, setSharedAcct] = useState('AfxBRZewiD7ofswb2SYek9793iyzxUJ4CvPWFfwp8ZwP');
  const [sharedAcctBalance, setSharedAcctBalance] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [member1Acct, setMember1Acct] = useState('');
  const [member2Acct, setMember2Acct] = useState('');
  const [member1Shares, setMember1Shares] = useState('');
  const [member2Shares, setMember2Shares] = useState('');
  const [member1Withdraw, setMember1Withdraw] = useState('');
  const [member2Withdraw, setMember2Withdraw] = useState('');

  // UI state
  const [fetching, setFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  async function onSubmit (e) {
    e.preventDefault()
    setFetching(true);

    try {
      const stateAcctInfo = await fetchStateAccountInfo(stateAcct, sharedAcct);
      let { isInitialized, member1Acct, member2Acct, member1Shares, member2Shares, member1Withdraw, member2Withdraw, sharedAcctBalance } = stateAcctInfo;
      member1Withdraw = parseFloat(member1Withdraw) / 100;
      member2Withdraw = parseFloat(member2Withdraw) / 100;

      setSharedAcctBalance(sharedAcctBalance);
      setIsInitialized(isInitialized);
      setMember1Acct(member1Acct);
      setMember2Acct(member2Acct);
      setMember1Shares(member1Shares);
      setMember2Shares(member2Shares);
      setMember1Withdraw(member1Withdraw);
      setMember2Withdraw(member2Withdraw);

      setFetching(false);
      setFetchSuccess(true)
      setTimeout(() => setFetchSuccess(false), 2000)
    } catch (err) {
      setFetching(false);
      setFetchError(true);
      setTimeout(() => setFetchError(false), 2000)
    }
  }

  return (
    <Layout>
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none" tabIndex="0">
        <div className="max-w-7xl mx-auto mb-4 mt-6 px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Fetch Account Data</h1>
        </div>
        <NotificationPanel show={fetchSuccess} bgColor="bg-green-100" message="Publisher data updated!" />
        <NotificationPanel show={fetchError} bgColor="bg-red-100" message="Error updating Publisher data!" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={onSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="stateAcct" className="block text-sm font-medium text-gray-700">State Account</label>
                  <input 
                    type="text" 
                    name="stateAcct" 
                    value={stateAcct}
                    onChange={evt => setStateAcct(evt.target.value)} 
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                  />
                </div>
                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="sharedAcct" className="block text-sm font-medium text-gray-700">Shared Account</label>
                  <input 
                    type="text" 
                    name="sharedAcct" 
                    value={sharedAcct}
                    onChange={evt => setSharedAcct(evt.target.value)} 
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                  />
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              { fetching ? (
                    <div className="inline-block text-center py-2 px-2 border border-transparent shadow-sm rounded-md h-10 w-20 bg-indigo-600 hover:bg-indigo-700">
                      <PulseLoader color="white" loading={fetching} size={9} /> 
                    </div>
                  ) : (
                    <button type="submit" className="h-10 w-20 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Fetch
                    </button>
                  ) 
                }
              </div>
            </div>
          </form>
        </div>
      </div>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto mb-4 px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Account Details</h1>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="isInitialized" className="block text-sm font-medium text-gray-700">Shared Account Balance</label>
                    <input 
                      type="text" 
                      name="sharedAccBalance" 
                      value={sharedAcctBalance}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="isInitialized" className="block text-sm font-medium text-gray-700">Is Initialized</label>
                    <input 
                      type="text" 
                      name="isInitialized" 
                      value={isInitialized}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="member1Acct" className="block text-sm font-medium text-gray-700">Member 1 Account</label>
                    <input
                      type="text" 
                      name="member1Acct" 
                      value={member1Acct}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="member2Acct" className="block text-sm font-medium text-gray-700">Member 2 Account</label>
                    <input
                      type="text" 
                      name="member2Acct" 
                      value={member2Acct}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="member1Shares" className="block text-sm font-medium text-gray-700">Member 1 Shares</label>
                    <input
                      type="text" 
                      name="member1Shares" 
                      value={member1Shares + '%'}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="member2Shares" className="block text-sm font-medium text-gray-700">Member 2 Shares</label>
                    <input
                      type="text" 
                      name="member2Shares" 
                      value={member2Shares + '%'}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="member1WithDraw" className="block text-sm font-medium text-gray-700">Member 1 Withdraw</label>
                    <input
                      type="text" 
                      name="member1Withdraw" 
                      value={member1Withdraw}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="member2Withdraw" className="block text-sm font-medium text-gray-700">Member 2 Withdraw</label>
                    <input
                      type="text" 
                      name="member2Withdraw" 
                      value={member2Withdraw}
                      disabled
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
