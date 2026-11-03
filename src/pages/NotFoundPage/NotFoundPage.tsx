import { Link } from 'react-router'
import { ROUTES } from '@/constants'
import ui from '@/styles/ui.module.scss'

type NotFoundPageProps = { message?: string }

export const NotFoundPage = ({ message = 'Страница не найдена.' }: NotFoundPageProps) => (
  <div className={ui.panel}>
    <h1>{message}</h1>
    <Link to={ROUTES.OBJECTS}>К списку объектов</Link>
  </div>
)
