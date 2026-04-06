import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #e5e7eb",
        padding: "1.5rem 1rem",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#6b7280",
        backgroundColor:"rgb(253 248 235 / var(--tw-bg-opacity, 1))"
      }}
    >
      <p style={{ marginBottom: "0.5rem" }}>
        © {new Date().getFullYear()} Maya's Learning Center
      </p>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <span>•</span>
        <Link href="/terms">Terms of Service</Link>
      </div>
    </footer>
  );
}
