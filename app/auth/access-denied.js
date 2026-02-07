// 'use client';

// import { useSearchParams } from "next/navigation";
// import Link from "next/link";

// export default function AccessDeniedPage(){
//     const searchParams = useSearchParams();
//     const email = searchParams.get('email') || 'your email';

//     return(
//         <div >

//         </div>
//     )
// }

'use client';

import { useSearchParams } from 'next/navigation';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccessDenied() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <svg className="w-16 h-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Access Not Authorized
        </h1>

        {/* Message */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-center">
            Your email address <span className="font-semibold text-indigo-600">{email}</span> is not registered in our system.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">To request access:</h2>
          <ol className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="font-semibold text-indigo-600 mr-2">1.</span>
              <span>Contact your learning center administrator</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-indigo-600 mr-2">2.</span>
              <span>Provide your email address for registration</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-indigo-600 mr-2">3.</span>
              <span>Wait for approval notification</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-indigo-600 mr-2">4.</span>
              <span>Sign in again once registered</span>
            </li>
          </ol>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">Need Help?</h3>
          <div className="space-y-3">
            <a 
              href="mailto:admin@mathlearningcenter.com" 
              className="flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-700 transition"
            >
              <Mail className="w-5 h-5" />
              <span>admin@mathlearningcenter.com</span>
            </a>
            <a 
              href="tel:+15551234567" 
              className="flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-700 transition"
            >
              <Phone className="w-5 h-5" />
              <span>(555) 123-4567</span>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          
          <a
            href="mailto:admin@mathlearningcenter.com?subject=Access%20Request&body=Hi,%0A%0AI%20would%20like%20to%20request%20access%20to%20the%20Math%20Learning%20Portal.%0A%0AMy%20email:%20"
            className="flex items-center justify-center space-x-2 w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            <Mail className="w-5 h-5" />
            <span>Request Access via Email</span>
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Only registered students and teachers can access this platform.
        </p>
      </div>
    </div>
  );
}