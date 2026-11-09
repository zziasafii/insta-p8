export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: 9 November 2026</p>

      <section className="space-y-4">
        <p>
          This app is run by <strong>The Penny Notebook</strong> (@thepennynotebook on Instagram). It uses the
          Instagram API to send automatic replies when someone comments on our posts or sends us a direct
          message with a keyword, such as a link to a free download.
        </p>

        <h2 className="text-xl font-semibold mt-6">Data we process</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your Instagram username and account ID, when you comment on our posts or message us</li>
          <li>The text of the comment or message that triggered a reply</li>
          <li>The replies we send you</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">How we use it</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To send you the reply or link you asked for</li>
          <li>To keep a record of our conversations so we can answer follow-up questions</li>
          <li>We do <strong>not</strong> sell or share your data with third parties for marketing</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Storage</h2>
        <p>
          Data is stored in our database hosted by Supabase and processed by our app hosted on Vercel. We keep
          conversation records only as long as needed to run the service.
        </p>

        <h2 className="text-xl font-semibold mt-6">Deleting your data</h2>
        <p>
          To have your data deleted, send a direct message saying &quot;delete my data&quot; to
          @thepennynotebook on Instagram. We will delete your stored messages and account ID within 30 days and
          confirm by message.
        </p>

        <h2 className="text-xl font-semibold mt-6">Contact</h2>
        <p>For any questions, send a direct message to @thepennynotebook on Instagram.</p>
      </section>
    </div>
  )
}
