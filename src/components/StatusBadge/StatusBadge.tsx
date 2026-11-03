import clsx from 'clsx'
import { STATUS_LABEL, TASK_STATUS, type Status } from '@/constants'
import styles from './StatusBadge.module.scss'

const statusClass: Record<Status, string> = {
  [TASK_STATUS.NEW]: styles.new,
  [TASK_STATUS.IN_PROGRESS]: styles.inProgress,
  [TASK_STATUS.REVIEW]: styles.review,
  [TASK_STATUS.ACCEPTED]: styles.accepted,
  [TASK_STATUS.REWORK]: styles.rework,
}

export const StatusBadge = ({ status }: { status: Status }) => (
  <span className={clsx(styles.badge, statusClass[status])}>{STATUS_LABEL[status]}</span>
)
