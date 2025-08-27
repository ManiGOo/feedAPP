// Navbar.jsx
import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm fixed top-0 left-0 w-full z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-center items-center">
                <Link to="/" className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                    Feed
                </Link>
            </div>
        </nav>
    );
}
