import styles from "../page.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Auth / Sign In</h1>
        <p>This auth route belongs to the Landing & Auth app (<code>apps/web</code>).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px", marginTop: "1rem" }}>
          <input
            type="email"
            placeholder="Email address"
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #444", background: "transparent", color: "inherit" }}
          />
          <input
            type="password"
            placeholder="Password"
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #444", background: "transparent", color: "inherit" }}
          />
          <div className={styles.ctas} style={{ marginTop: "8px" }}>
            <a className={styles.primary} href="/dashboard" style={{ width: "100%", textAlign: "center" }}>
              Sign In to Dashboard →
            </a>
          </div>
          <div className={styles.ctas}>
            <a className={styles.secondary} href="/" style={{ width: "100%", textAlign: "center" }}>
              ← Back to Landing
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
