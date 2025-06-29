import React from 'react';

const Home = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-800 min-h-screen text-white p-10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <i className="fas fa-clock text-3xl text-amber-400"></i>
            <h1 className="text-3xl font-bold text-white">TimeShareDAO</h1>
          </div>
          <button className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105">
            Connect Wallet
          </button>
        </header>

        {/* Hero Section */}
        <section className="mb-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Tokenize Your Expertise</h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-10">
            Mint NFTs for your time slots, get paid automatically after verified sessions, and build your decentralized professional network.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-8 rounded-full transition-all duration-300">
              Become a Provider
            </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-900 font-bold py-3 px-8 rounded-full transition-all duration-300">
              Browse Sessions
            </button>
          </div>
        </section>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {/* Calendar Section */}
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-6 lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-6">Your Available Slots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/20 text-white rounded-lg p-4">9:00 AM - 10:00 AM</div>
              <div className="bg-white/20 text-white rounded-lg p-4">11:00 AM - 12:00 PM</div>
            </div>
            <button className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full w-full transition-all duration-300">
              Mint Selected Slots as NFTs
            </button>
          </div>

          {/* Session Details */}
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Session Details</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-purple-200 mb-2">Service Type</label>
                <select className="w-full bg-white bg-opacity-20 text-white rounded-lg p-3 border border-purple-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400">
                  <option>DeFi Consulting</option>
                  <option>Smart Contract Audit</option>
                  <option>DAO Governance</option>
                  <option>Web3 Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-purple-200 mb-2">Price (ETH)</label>
                <input type="number" defaultValue="0.05" step="0.01" className="w-full bg-white bg-opacity-20 text-white rounded-lg p-3 border border-purple-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-purple-200 mb-2">Meeting Duration</label>
                <select className="w-full bg-white bg-opacity-20 text-white rounded-lg p-3 border border-purple-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400">
                  <option>30 minutes</option>
                  <option selected>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300">
                <i className="fas fa-video mr-2"></i> Generate Zoom Link
              </button>
            </div>
          </div>
        </main>

        {/* User Type */}
        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6">User Type</h3>
          <div className="space-y-4">
            <label className="block text-purple-200 mb-2">Select User Type</label>
            <select className="w-full bg-white bg-opacity-20 text-white rounded-lg p-3 border border-purple-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400">
              <option>Provider</option>
              <option>Consumer</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserT;
