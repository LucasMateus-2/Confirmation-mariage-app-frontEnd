import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import FeedbackMessage from '../Auth/FeedbackMessage.vue'

describe('FeedbackMessage', () => {
  it('renders the provided message', () => {
    const wrapper = mount(FeedbackMessage, {
      props: {
        message: 'Acesso liberado!',
        type: 'success'
      }
    })

    expect(wrapper.text()).toContain('Acesso liberado!')
  })
})
