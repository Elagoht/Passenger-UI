import { IconCopyCheck, IconIdBadge } from "@tabler/icons-react"
import { FC } from "react"
import StringHelper from "../../../helpers/string"
import Service from "../../../services"
import { useAuthorizationSlice } from "../../../stores/authorization"
import { useNotificationSlice } from "../../../stores/notification"
import { ConstantPair, ListableDatabaseEntry, ReadWriteDatabaseEntry } from "../../../types/common"

interface IIdentityCopyButtonProps {
  id: ListableDatabaseEntry["id"]
}

const IdentityCopyButton: FC<IIdentityCopyButtonProps> = ({ id }) => {
  const accessToken = useAuthorizationSlice(state => state.accessToken)
  const addNotification = useNotificationSlice(state => state.addNotification)

  return <button
    onClick={() => Service.fetch(
      accessToken,
      id!
    ).then(async (response) => {
      if (response.status !== 0) return addNotification({
        type: "error",
        title: "Failed to obtain identity",
        message: StringHelper.removeUnixErrorPrefix(response.stderr)
      })

      const { identity } = StringHelper.deserialize<ReadWriteDatabaseEntry>(response.stdout)

      const result = identity.startsWith("_$")
        ? await Service.remember(
          accessToken,
          identity.substring(2)
        ).then((response) => {
          if (response.status === 0) return StringHelper
            .deserialize<ConstantPair>(response.stdout).value
          addNotification({
            type: "error",
            title: "Not recognized",
            message: "This key has no paired value!"
          })
          return null
        })
        : identity

      if (result === null) return

      navigator.clipboard.writeText(
        result ?? identity // Fallback to original identity if result is null
      ).then(() => addNotification({
        type: "success",
        icon: <IconCopyCheck />,
        message: "I kwnow who you are 😉"
      })).catch(() => addNotification({
        type: "error",
        title: "Failed to copy identity",
        message: "Please try again"
      }))
    })}
    className="h-full bg-white dark:bg-tuatara-800 hover:brightness-90 transition-all aspect-square w-10 grid place-items-center shrink-0"
  >
    <IconIdBadge />
  </button>
}

export default IdentityCopyButton
