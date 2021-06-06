import { useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { useAuth } from '../context/auth';
import { withdraw } from '../lib/solana';
import Layout from '../components/AppLayout';
import NotificationPanel from '../components/NotificationPanel';

const member1XAcct = '6FGu3gyzDrrubxk2wwbHchs3CGcM2kutpikQbGj6vSE2';
const member2XAcct = '2xhkkkAgLXyxmGXVwxC72uJLUxEnUFDZXVhyzNMktZLa';

const memberxAccount = member1XAcct

export default function Withdraw() {
  const { wallet, setWallet } = useAuth();

  // State Account state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState(memberxAccount);

  // UI state
  const [fetching, setFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  async function onSubmit (e) {
    e.preventDefault()
    setFetching(true);

    try {
      const result = await withdraw(withdrawAmount, withdrawAccount);
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
          <h1 className="text-2xl font-semibold text-gray-900">Withdraw</h1>
        </div>
        <NotificationPanel show={fetchSuccess} bgColor="bg-green-100" message="Publisher data updated!" />
        <NotificationPanel show={fetchError} bgColor="bg-red-100" message="Error updating Publisher data!" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={onSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-3 bg-white space-y-3 sm:p-6">
                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700">Withdraw Amount</label>
                  <input 
                    type="text" 
                    name="withdrawAmount" 
                    value={withdrawAmount}
                    onChange={evt => setWithdrawAmount(evt.target.value)} 
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                  />
                </div>
                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="withdrawAccount" className="block text-sm font-medium text-gray-700">Withdraw Account</label>
                  <input 
                    type="text" 
                    name="withdrawAccount" 
                    value={withdrawAccount}
                    onChange={evt => setWithdrawAccount(evt.target.value)} 
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
                      Withdraw
                    </button>
                  ) 
                }
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  </Layout>
  );
}
