//src/components/Sidebar.jsx

import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="hidden md:block w-64 bg-gray-50 h-screen pt-20 px-6 fixed left-0 border-r">
      <ul className="space-y-6 text-lg">
        <li><Link to="/" className="hover:text-blue-600">🏠 Home</Link></li>
        <li><Link to="/create" className="hover:text-blue-600">✍️ Create Post</Link></li>
        <li><Link to="/profile/1" className="hover:text-blue-600">👤 Profile</Link></li>
      </ul>
    </aside>
  );
}

export default Sidebar;
