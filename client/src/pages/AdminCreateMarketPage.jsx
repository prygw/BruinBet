import React from 'react'
import { useCreateMarket } from '../hooks/useCreateMarket'
import { MarketForm } from '../components/MarketForm'

function AdminCreateMarketPage({ session, onCreated }) {
  if (!session || !onCreated) {
    return (
      <p className="form-server-error">
        Either session or onCreated callback is missing. Please ensure you are logged in and try again.
      </p>
    )
  }

  const { submit, submitting, error: serverError } = useCreateMarket(session.token)

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
    <section className="landing-layout flex-center-wrapper" aria-labelledby="admin-create-title">
      <div 
        className="market-creation-card" 
        style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#232f48' }}
      >
        
        <div className="section-heading" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p className="eyebrow" style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#ffffff' }}>
            Admin Dashboard
          </p>
          <h1 id="admin-create-title" style={{ margin: '8px 0 0', fontSize: '1.5rem' }}>
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
