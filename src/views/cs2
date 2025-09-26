<template>
  <fieldset>
    <legend>Add new friend</legend>
    <label>
      Name:
      <input v-model="friendName" type="text" />
    </label>
    <br />
    <label>
      Age:
      <input v-model="friendAge" type="number" />
    </label>
    <br />
    <button @click="addFriend">Add Friend</button>
    <p>{{ status }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { db } from '../db.ts'

interface Props {
  defaultAge?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultAge: 21
})

const status = ref('')
const friendName = ref('')
const friendAge = ref(props.defaultAge)

const addFriend = async () => {
  try {
    const id = await db.friends.add({
      name: friendName.value,
      age: friendAge.value,
    })

    status.value = `Friend ${friendName.value} successfully added. Got id ${id}`
    friendName.value = ''
    friendAge.value = props.defaultAge
  } catch (error) {
    status.value = `Failed to add ${friendName.value}: ${error}`
  }
}
</script>