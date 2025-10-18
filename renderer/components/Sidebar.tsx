import React from 'react';
import Link from 'next/link';
import HomeIcon from './Icons/Home';
import GithubIcon from './Icons/Github';

export default function Sidebar() {
	return (
		<div className="fixed left-0 top-0 w-48 h-screen bg-gray-900 text-white flex flex-col">
			{/* Logo and Name */}
			<div className="flex items-center p-4 border-b border-gray-700">
				<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
					<span className="text-white font-bold text-sm">T</span>
				</div>
				<h1 className="text-xl font-semibold">Thunder</h1>
			</div>

			{/* Navigation */}
			<nav className="flex-1 p-2">
				<ul className="space-y-1">
					<li>
						<Link
							href="/"
							className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
						>
							<HomeIcon className="w-5 h-5 mr-2" />
							Home
						</Link>
					</li>
				</ul>
			</nav>

			<div className="p-2">
				<Link
					href="/next"
					className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
				>
					Debug Info
				</Link>
			</div>

			{/* Bottom Icons */}
			<div className="p-2 border-t border-gray-700">
				<div className="flex space-x-2">
					<button
						onClick={() => window.ipc.send('open-new-window', { url: 'https://github.com/ZeusJunior/thunder', external: true })}
						className="cursor-pointer flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
						title="GitHub Repository"
					>
						<GithubIcon className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
};