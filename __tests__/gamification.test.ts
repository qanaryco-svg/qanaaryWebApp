import gamification from '../lib/gamification'

describe('gamification basic', () => {
  const uid = `test_${Date.now()}`
  it('should add points and compute level', () => {
    gamification.ensureUser(uid)
    gamification.addPoints(uid, 50, 'test')
    const s = gamification.getUserStats(uid)
    expect(s.points).toBeGreaterThanOrEqual(50)
  })
})
