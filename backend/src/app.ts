import express from 'express'
import dotenv from 'dotenv'
import { Clients } from './types'
import { createResources } from './startup/createResources'
import { createRoutes } from './startup/createRoutes'
import cors from 'cors'

dotenv.config()

const run = async () => {
  const app = express()
  app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }))
  const clients: Clients = await createResources()

  app.use(express.json())
  app.use(createRoutes(clients))

  const PORT = process.env.PORT || 8002
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
}

run()
