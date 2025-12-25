// // components/Footer.js
// import { useNavigate } from 'react-router-dom';

// export default function Footer() {
//   const navigate = useNavigate();

//   const handleNavigation = (path) => {
//     navigate(path);
//   };

//   return (
//     <footer className="bg-white-50 border-t border-gray-200 py-12">
//       <div className="max-w-7xl mx-auto px-10">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto md:max-w-none md:mx-0 md:justify-items-center">

//           {/* Product Section */}
//           <div>
//             <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">
//               PRODUCT
//             </h3>
//             <ul className="space-y-3">
//               <li>
//                 <button
//                   onClick={() => handleNavigation('/')}
//                   className="text-gray-600 hover:text-gray-900 transition-colors text-left"
//                 >
//                   Home
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => handleNavigation('/plans')}
//                   className="text-gray-600 hover:text-gray-900 transition-colors text-left"
//                 >
//                   Plans
//                 </button>
//               </li>
//             </ul>
//           </div>

//           {/* Resources Section */}
//           <div>
//             <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">
//               RESOURCES
//             </h3>
//             <ul className="space-y-3">
//               <li>
//                 <button
//                   onClick={() => handleNavigation('/contact')}
//                   className="text-gray-600 hover:text-gray-900 transition-colors text-left"
//                 >
//                   Contact us
//                 </button>
//               </li>
//             </ul>
//           </div>

//           {/* Company Section */}
//           <div>
//             <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">
//               COMPANY
//             </h3>
//             <ul className="space-y-3">
//               <li>
//                 <button
//                   onClick={() => handleNavigation('/about')}
//                   className="text-gray-600 hover:text-gray-900 transition-colors text-left"
//                 >
//                   About Us
//                 </button>
//               </li>
//             </ul>
//           </div>

//           {/* Legal Section */}
//           <div>
//             <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">
//               LEGAL
//             </h3>
//             <ul className="space-y-3">
//               <li>
//                 <button
//                   onClick={() => handleNavigation('/login')}
//                   className="text-gray-600 hover:text-gray-900 transition-colors text-left"
//                 >
//                   Login
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => handleNavigation('/register')}
//                   className="text-gray-600 hover:text-gray-900 transition-colors text-left"
//                 >
//                   Register
//                 </button>
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Bottom Section with Logo */}
//         <div className="pt-8 border-t border-gray-200">
//           <div className="flex items-center gap-3">
//             {/* Logo Icon */}
//             <div
//               className="w-12 h-12 rounded-full flex items-center justify-center relative"
//               style={{backgroundColor: '#5A33FF'}}
//             >
//               <img
//                 src="/bug.png"
//                 alt="Bug Icon"
//                 className="w-8 h-8 object-contain"
//               />
//             </div>

//             {/* Text Content */}
//             <div>
//               <h4 className="text-gray-900 font-semibold text-lg">Smellify</h4>
//               <p className="text-gray-500 text-sm">Providing reliable tech since 2025</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }

// components/Footer.js
import { useNavigate } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        {/* Top */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#5A33FF" }}
              >
                <img
                  src="/bug.png"
                  alt="Bug Icon"
                  className="h-8 w-8 object-contain"
                />
              </div>

              <button
                onClick={() => handleNavigation("/")}
                className="text-xl font-semibold text-gray-900 hover:opacity-90"
              >
                Smellify
              </button>
            </div>

            <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600">
              Github integrated Code Smell Detection Tool for Developers.
              Analyze your codebase, identify potential issues, and improve code
              quality with ease.
            </p>

            {/* Social icons (visual only, add links later if you want) */}
            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://github.com/smellify"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>

              <button
                type="button"
                className="h-11 w-11 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="h-11 w-11 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {/* Product */}
              <div>
                <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">
                  Product
                </h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <button
                      onClick={() => handleNavigation("/")}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Home
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation("/plans")}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Plans
                    </button>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">
                  Resources
                </h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <button
                      onClick={() => handleNavigation("/contact")}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Contact us
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation("/about")}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      About Us
                    </button>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-4">Legal</h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <button
                      onClick={() => handleNavigation("/login")}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Login
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation("/register")}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Register
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            © {year} Smellify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
