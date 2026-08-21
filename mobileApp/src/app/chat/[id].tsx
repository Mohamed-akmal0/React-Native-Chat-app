import { useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ChatDetailScreen = () => {
  const {id, participantId, name, avatar} = useLocalSearchParams();
  console.log('details in chat d', id, participantId, name, avatar)
  return (
    <SafeAreaView className='flex-1' >
      <Text className='text-white' >chat details screen</Text>
    </SafeAreaView>
  )
}

export default ChatDetailScreen;