"use client"

import type React from "react"
import { useState } from "react"
import { Crown, Plus, MoreVertical, UserMinus } from "lucide-react"
import { hasFlag } from "country-flag-icons"
import * as flags from "country-flag-icons/react/3x2"

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
  steam_id?: string
  steam_username?: string
  steam_avatar_medium?: string
  steam_avatar_full?: string
  steam_profile_url?: string
  steam_real_name?: string
  elo?: number
  country?: string
  country_flag?: string
  role?: string
  [key: string]: unknown
}

interface Team {
  id: number
  team_id: string
  name?: string
  is_private: boolean
  status: string
  region: string
  max_players: number
  user_ids: number[]
  leader_id: number
  created_at: string
  updated_at: string
  leader: User
  members: User[]
  is_in_active_match?: boolean
  can_be_challenged?: boolean
}

interface TeamPartyCardProps {
  team: Team
  currentUser: User | null
  authUserId?: number | null
  onInviteFriends: () => void
  onLeaveTeam: () => void
  onKickMember: (memberId: number) => void
  onMakeLeader?: (memberId: number) => void
  onBlockAndKick?: (memberId: number) => void
  isLoading: boolean
}

const TeamPartyCard: React.FC<TeamPartyCardProps> = ({
  team,
  currentUser,
  onInviteFriends,
  onLeaveTeam,
  onKickMember,
  onMakeLeader,
  onBlockAndKick,
  isLoading,
  authUserId,
}) => {
  const isLeader = (authUserId != null ? authUserId : (currentUser ? currentUser.id : null)) === team.leader_id

  const [openMenuMemberId, setOpenMenuMemberId] = useState<number | null>(null)

  // Close menu when clicking outside
  const handleOutsideClick = () => {
    setOpenMenuMemberId(null)
  }

  // Filter out the leader from other members to avoid duplication
  // The leader will always be shown in the center, so exclude them from side slots
  const otherMembers = team.members.filter((member) => member.id !== team.leader_id)

  // Always show 4 empty slots around the center leader
  const leftSlots = otherMembers.slice(0, 2)
  const rightSlots = otherMembers.slice(2, 4)

  // Helper function to render member card
  const renderMemberCard = (member: User | null, slotIndex: number) => {
    if (!member) {
      // Empty slot
      return (
        <div className="group" key={`empty-${slotIndex}`} onClick={onInviteFriends} role="button" aria-label="Invite friend">
          <div className="bg-gray-800/30 border-1 border-gray-600/40 h-80 hover:border-gray-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-center items-center">
            <div className="text-center flex flex-col justify-center items-center h-full">
              <Plus className="w-16 h-16 text-gray-500 group-hover:text-gray-400" />
            </div>
          </div>
        </div>
      )
    }

    const getFlagComponent = (countryCode: string) => {
      if (!countryCode || !hasFlag(countryCode)) return null
      const FlagComponent = flags[countryCode as keyof typeof flags]
      return FlagComponent ? <FlagComponent className="w-6 h-4 shadow-sm" /> : null
    }

    // Member card
    return (
      <div className="relative group" key={member.id}>
        <div className="bg-gray-800/50 border border-gray-600/60 p-4 h-80 hover:border-gray-500/80 transition-all duration-200 flex flex-col justify-center items-center relative">
          <div className="text-center flex flex-col justify-center items-center h-full">
            {/* Profile Picture */}
            <div className="relative mb-3">
              <img
                src={member.steam_avatar_medium || "/default-avatar.png"}
                alt={`${member.steam_username || member.name}'s Avatar`}
                className="w-16 h-16"
              />
            </div>

            {/* Username */}
            <div className="text-white font-bold text-sm font-['Trebuchet'] mb-2">
              {member.steam_username || member.name}
            </div>

            {/* Country Flag */}
            {member.country && (
              <div className="mt-2 mb-2" title={member.country}>
                {getFlagComponent(member.country)}
              </div>
            )}

            {/* ELO */}
            <div className="mt-1 flex items-center justify-center space-x-1 mb-2">
              <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">★</span>
              </div>
              <span className="text-gray-300 text-sm font-['Trebuchet']">{member.elo || 0} elo</span>
            </div>
          </div>

          {/* Leader actions dropdown for non-leader members - moved outside of text-center div */}
          {isLeader && member.id !== team.leader_id && (
            <div className="absolute top-3 right-3">
              <button
                type="button"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md  text-gray-300 hover:text-white  transition-all duration-150 "
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuMemberId(openMenuMemberId === member.id ? null : member.id)
                }}
                aria-label="Member actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {openMenuMemberId === member.id && (
                <>
                  {/* Backdrop to close menu when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={handleOutsideClick}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-black/50 backdrop-blur-sm border border-gray-600/20 rounded shadow-2xl min-w-[180px] z-50 overflow-hidden">
                    {onMakeLeader && (
                      <button
                        onClick={() => { setOpenMenuMemberId(null); onMakeLeader(member.id) }}
                        className="block w-full text-left text-sm text-gray-200 hover:text-white hover:bg-orange-400/50 px-3 py-2 transition-colors duration-150"
                        disabled={isLoading}
                      >
                        Make Team Leader
                      </button>
                    )}
                    <button
                      onClick={() => { setOpenMenuMemberId(null); onKickMember(member.id) }}
                      className="block w-full text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 px-3 py-2 transition-colors duration-150"
                      disabled={isLoading}
                    >
                      Kick User
                    </button>
                    {onBlockAndKick && (
                      <button
                        onClick={() => { setOpenMenuMemberId(null); onBlockAndKick(member.id) }}
                        className="block w-full text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 px-3 py-2 transition-colors duration-150 border-t border-gray-700/20"
                        disabled={isLoading}
                      >
                        Block User & Kick
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="">
      {/* Team Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <h3 className=" text-[#f79631] text-xl font-bold uppercase tracking-wider">
            {team.name || `Team ${team.team_id.slice(0, 8)}`}
          </h3>
          <div
            className={`inline-flex items-center px-2 py-1  text-xs font-['Trebuchet'] font-medium uppercase tracking-wide ${
              team.is_private
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}
          >
            {team.is_private ? "Private" : "Public"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-400 font-['Trebuchet']">
              {team.members.length}/{team.max_players} players
            </div>
            <div className="text-xs text-gray-500 uppercase font-['Trebuchet'] tracking-wide">{team.region}</div>
          </div>
          <button
            onClick={onLeaveTeam}
            disabled={isLoading}
            title="Leave team"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-400/30 text-red-400 hover:text-red-300 hover:border-red-400/60 hover:bg-red-500/10 transition-colors"
            aria-label="Leave team"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 mb-8 max-w-5xl mx-auto">
        {/* Left Slot 1 */}
        {renderMemberCard(leftSlots[0] || null, 0)}

        {/* Left Slot 2 */}
        {renderMemberCard(leftSlots[1] || null, 1)}

        {/* Center - Leader Card */}
        <div className="relative group">
          <div className="bg-gradient-to-br from-[#f79631]/25 to-[#f79631]/10 border-2 border-[#f79631]/60 p-6 h-80 shadow-2xl transform scale-105 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f79631]/10 to-transparent"></div>

            {/* Selection indicator */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#f79631] rounded-full shadow-lg"></div>

            <div className="text-center flex flex-col justify-center items-center h-full relative z-10">
              {/* Profile Picture */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-[#f79631]/30 rounded-full blur-sm"></div>
                <img
                  src={team.leader?.steam_avatar_medium || "/default-avatar.png"}
                  alt="Leader Avatar"
                  className="relative w-20 h-20"
                />
              </div>

              {/* Username */}
              <div className="text-white font-bold text-lg font-['Trebuchet'] mb-3 drop-shadow-sm relative">
                <Crown className="absolute -top-3.5 -right-2 w-4 h-4 text-orange-400 opacity-50 drop-shadow-lg" />
                {team.leader?.steam_username || team.leader?.name || "Leader"}
              </div>

              {/* Status and Country */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                {team.leader?.country && (
                  <div title={team.leader?.country}>
                    {(() => {
                      if (!hasFlag(team.leader.country)) return null
                      const FlagComponent = flags[team.leader.country as keyof typeof flags]
                      return FlagComponent ? <FlagComponent className="w-8 h-5 shadow-lg" /> : null
                    })()}
                  </div>
                )}
              </div>

              {/* ELO with special styling */}
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-[#f79631] rounded flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">★</span>
                </div>
                <span className="text-[#f79631] text-sm font-['Trebuchet'] drop-shadow-sm">
                  {team.leader?.elo || 0} elo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Slot 1 */}
        {renderMemberCard(rightSlots[0] || null, 2)}

        {/* Right Slot 2 */}
        {renderMemberCard(rightSlots[1] || null, 3)}
      </div>

      {/* Action Buttons removed: empty slots now open Invite modal; leave is an icon */}

      {/* Debug info - remove this in production */}
    
    </div>
  )
}

export default TeamPartyCard