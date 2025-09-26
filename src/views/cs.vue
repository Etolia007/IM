<template>
  <div>
    <h2>朋友列表</h2>
    <ul>
      <li v-for="friend in friends" :key="friend.id">
        {{ friend.name }} - {{ friend.age }}岁
        <button @click="deleteFriend(friend.id)">删除</button>
      </li>
    </ul>
    
    <h2>添加新朋友</h2>
    <form @submit.prevent="addNewFriend">
      <input v-model="newFriend.name" type="text" placeholder="姓名" required>
      <input v-model="newFriend.age" type="number" placeholder="年龄" required>
      <button type="submit">添加朋友</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { db } from '../db';

const friends = ref();
const newFriend = ref({
  name: '',
  age: ''
});

// 加载朋友列表
const loadFriends = async () => {
  friends.value = await db.friends.toArray();
};

// 添加新朋友
const addNewFriend = async () => {
  try {
    await db.friends.add({
      name: newFriend.value.name,
      age: parseInt(newFriend.value.age)
    });
    
    // 重置表单
    newFriend.value = { name: '', age: '' };
    
    // 重新加载列表
    await loadFriends();
  } catch (error) {
    console.error('添加朋友失败:', error);
  }
};

// 删除朋友
const deleteFriend = async (id: number) => {
  try {
    await db.friends.delete(id);
    await loadFriends(); // 重新加载列表
  } catch (error) {
    console.error('删除朋友失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadFriends();
});
</script>