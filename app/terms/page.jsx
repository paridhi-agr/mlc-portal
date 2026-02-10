export const metadata = {
    title: "Terms of Service | Maya's Learning Center Portal",
  };
  
  export default function TermsOfService() {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
  
        <p className="mb-4">
          By accessing or using Maya's Learning Center Portal, you agree to these Terms
          of Service.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">User Eligibility</h2>
        <p className="mb-4">
          Only registered students and teachers approved by the organization
          may use this platform.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Account Access</h2>
        <p className="mb-4">
          Access is provided via Google Sign-In. Unauthorized users will be
          denied access.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Acceptable Use</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Do not misuse the platform</li>
          <li>Do not attempt to access restricted data</li>
          <li>Do not upload malicious or inappropriate content</li>
        </ul>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Content Ownership</h2>
        <p className="mb-4">
          Assignment materials remain the property of the coaching center.
          Student submissions remain the property of the student.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Termination</h2>
        <p className="mb-4">
          We reserve the right to revoke access for violations of these terms.
        </p>
  
        <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
        <p>
          For questions, contact{" "}
          <a className="underline" href="mailto:infobymlc@gmail.com">
            infobymlc@gmail.com
          </a>
        </p>
      </main>
    );
  }
  