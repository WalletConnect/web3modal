import { proxy } from 'valtio/vanilla'

interface ProfileStoreState {
  profile:
    | {
        uuid: string
        account: string
        profile_uuid: string
        created_at: string
        is_main_account: boolean
      }[]
    | undefined
    | null
}

const state = proxy<ProfileStoreState>({
  profile: null
})

export const ProfileStore = {
  state,

  setProfile(profile: ProfileStoreState['profile']) {
    state.profile = profile
  }
}
