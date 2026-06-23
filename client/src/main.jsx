import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-calendar/dist/Calendar.css'
import './styles/global.css'
import App from './App.jsx'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App render error:', error, errorInfo?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ maxWidth: 560 }}>
          <div className="card">
            <h1 className="page-title" style={{ marginBottom: 10 }}>Something went wrong</h1>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              The page crashed while rendering. Please refresh or open the admin login again.
            </p>
            <a href="/admin/login" className="btn btn-primary">Go to Admin Login</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
