import { h, ref } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, useDialog } from 'naive-ui'

export function useCreateGameDialog() {
    const dialog = useDialog()

    function open() {
        return new Promise(resolve => {
            const name = ref('')
            const size = ref(8)
            let resolved = false

            const finish = (value) => {
                if (resolved) return
                resolved = true
                resolve(value)
            }

            const d = dialog.create({
                title: 'Создать игру',
                content: () => h(NForm, { labelPlacement: 'top' }, () => [
                    h(NFormItem, { label: 'Название игры' }, () =>
                        h(NInput, {
                            value: name.value,
                            placeholder: 'Например, «Быстрая партия»',
                            onUpdateValue: (v) => { name.value = v },
                        }),
                    ),
                    h(NFormItem, { label: 'Размер поля (4–20)' }, () =>
                        h(NInputNumber, {
                            value: size.value,
                            min: 4,
                            max: 20,
                            onUpdateValue: (v) => { size.value = v },
                        }),
                    ),
                ]),
                positiveText: 'Создать',
                negativeText: 'Отмена',
                onPositiveClick: () => {
                    const trimmed = name.value.trim()
                    if (!trimmed) return false
                    finish({ name: trimmed, size: size.value })
                },
                onNegativeClick: () => finish(null),
                onClose: () => finish(null),
                onMaskClick: () => { d.destroy(); finish(null) },
            })
        })
    }

    return { open }
}