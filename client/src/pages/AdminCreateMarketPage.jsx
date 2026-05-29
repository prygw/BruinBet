import { useCreateMarket } from '../hooks/useCreateMarket'
import { MarketForm } from '../components/MarketForm'

function AdminCreateMarketPage({ session, onCreated }) {
  const { submit, submitting, error: serverError } = useCreateMarket(session?.token)

  if (!session || !onCreated) {
    return (
      <p className="form-server-error">
        Either session or onCreated callback is missing. Please ensure you are logged in and try again.
      </p>
    )
  }

  if (!session.is_admin) {
    return <p className="empty-results text-center mt-10">Admins only.</p>
  }

  const handleFormSubmit = async (payload) => {
    const market = await submit(payload)
    if (market) {
      onCreated(market)
      return true // success
    }
    return false // failure
  }

  return (
    <section className="admin-create-layout" aria-labelledby="admin-create-title">
      <div className="market-creation-card">
        <div className="section-heading">
          <p className="eyebrow">
            Admin Dashboard
          </p>
          <h1 id="admin-create-title">
            Create a New Market
          </h1>
        </div>

        <MarketForm 
          onSubmit={handleFormSubmit}
          isSubmitting={submitting}
          serverError={serverError}
        />

      </div>
    </section>
  )
}

export default AdminCreateMarketPage
