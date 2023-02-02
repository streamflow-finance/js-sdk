import { StreamClient, Cluster } from './index'
import { describe, expect, test } from '@jest/globals'

describe('StreamClient', () => {
    
    test('should be defined', () => {
        expect(StreamClient).toBeDefined()
    })

    test('Should return a new StreamClient', () => {
        const solana_url = "https://api.mainnet-beta.solana.com"
        const streamClient = new StreamClient(
            solana_url,
            Cluster.Mainnet,
            "confirmed"
        )
        
        expect(streamClient).toBeInstanceOf(StreamClient)
        expect(streamClient.getConnection()).toBeDefined()
    })

})
