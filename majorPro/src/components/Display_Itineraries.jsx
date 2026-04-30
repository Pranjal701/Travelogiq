import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Display_Itineraries() {
  const navigate = useNavigate()
  const [itineraries, setItineraries] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    axios
      .get('http://localhost:5000/getUserItineraries', { withCredentials: true })
      .then((res) => {
        setItineraries(res.data)
        if (res.data.length === 0)
          setMessage('Generate Your First Itinerary with us!')
      })
      .catch(() => console.log('Error in Display_Itineraries at frontend'))
  }, [])

  const handleDeleteItinerary = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/delete_itinerary/${id}`, {
        withCredentials: true,
      })
      setItineraries((prev) => {
        const updated = prev.filter((item) => item._id !== id)
        if (updated.length === 0)
          setMessage('Generate Your First Itinerary with us!')
        return updated
      })
    } catch (error) {
      console.log('Error in handleDeleteItinerary at frontend')
    }
  }

  const handleShowItinerary = async (id) => {
    navigate(`/itinerary/${id}`)
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-2">
          Gallery
        </h2>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Previous Itineraries
        </h1>
      </div>

      {/* Empty state */}
      {itineraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <span className="material-symbols-outlined text-7xl text-slate-300 mb-4">
            flight_takeoff
          </span>
          <p className="text-xl font-semibold text-slate-400">{message}</p>
          <button
            onClick={() => navigate('/dashboard/details')}
            className="mt-6 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/25"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        /* Itinerary cards grid */
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all duration-300"
            >
              {/* Image */}
              <div className="h-52 overflow-hidden relative cursor-pointer" onClick={() => handleShowItinerary(item._id)}>
                {item.photoRef ? (
                  <img
                    src={`http://localhost:5000/place-photo?ref=${item.photoRef}`}
                    alt="Trip"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img
                    src={`/card${item.image_number}.png`}
                    alt="Trip"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {item.destination}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(item.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-primary material-symbols-outlined">verified</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowItinerary(item._id)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-50 text-slate-900 font-bold text-sm hover:bg-primary hover:text-white transition-all"
                  >
                    View Itinerary
                  </button>
                  <button
                    onClick={() => handleDeleteItinerary(item._id)}
                    title="Delete itinerary"
                    className="px-3 py-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Display_Itineraries
