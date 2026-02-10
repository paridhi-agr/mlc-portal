export const metadata = {
    title: "Privacy Policy | Maya's Learning Center",
  };
  
  export default function PrivacyPolicy() {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
  
        <p className="mb-4">
          Maya's Learning Center portal ("we", "our", or "us") respects your privacy.
          This Privacy Policy explains how we collect, use, and protect your
          information when you use our platform.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Name and email address from Google Sign-In</li>
          <li>User role (student or teacher)</li>
          <li>Assignment and submission metadata</li>
        </ul>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Information</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Authenticate users</li>
          <li>Provide access to assignments and submissions</li>
          <li>Display grades</li>
        </ul>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Google Drive Access</h2>
        <p className="mb-4">
          We do not access your personal Google Drive. All assignment files
          are managed by the organization and stored in shared folders.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Data Protection</h2>
        <p className="mb-4">
          We take reasonable measures to protect your data and do not sell or
          share personal information with third parties.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
        <p>
          If you have questions, contact us at{" "}
          <a className="underline" href="mailto:infobymlc@gmail.com">
            infobymlc@gmail.com
          </a>
        </p>
      </main>
    );
  }
  