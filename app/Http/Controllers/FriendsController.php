<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Friend;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FriendsController extends Controller
{
    private const USER_FIELDS = [
        'id', 'steam_id', 'steam_username', 'steam_real_name',
        'steam_avatar_medium', 'steam_avatar_full', 'elo', 
        'created_at', 'steam_authenticated_at'
    ];

    private const VALIDATION_RULES = [
        'friend_id' => 'required|exists:users,id',
        'search_query' => 'required|string|min:2|max:255',
        'block_reason' => 'nullable|string|max:1000',
    ];

    public function index()
    {
        $user = Auth::user();
        
        return Inertia::render('Friends', [
            'friends' => $this->formatUsers($user->allFriends()),
            'pendingRequests' => $user->pendingFriendRequests,
            'sentRequests' => $user->pendingFriends,
            'blockedFriends' => $this->formatUsers($user->blockedFriends),
        ]);
    }


    public function getFriendsForMatchmaking()
    {
        $user = Auth::user();
        $friends = $this->formatUsers($user->allFriends());
        return response()->json(['friends' => $friends]);
    }

    public function search(Request $request)
    {
        $this->validateRequest($request, ['query' => self::VALIDATION_RULES['search_query']]);
        $query = $request->input('query');
        $currentUser = Auth::user();
        $users = User::where(function($q) use ($query) {
            $q->where('steam_id', 'like', "%{$query}%")
              ->orWhere('steam_username', 'like', "%{$query}%")
              ->orWhere('steam_real_name', 'like', "%{$query}%")
              ->orWhere('name', 'like', "%{$query}%");
        })
        ->where('id', '!=', $currentUser->id)
        ->whereNotNull('steam_id')
        ->limit(10)
        ->get()
        ->map(fn($user) => $this->formatUserWithRelationship($user, $currentUser));
        return response()->json(compact('users'));
    }

    public function addFriend(Request $request)
    {
        $this->validateRequest($request, ['friend_id' => self::VALIDATION_RULES['friend_id']]);
        $currentUser = Auth::user();
        $friendId = $request->friend_id;
        if ($this->isSelfAction($currentUser->id, $friendId)) {
            return redirect()->back()->with('error', 'Cannot add yourself as a friend');
        }
        $existingFriendship = $currentUser->friendshipWith(User::find($friendId));
        if ($error = $this->validateFriendRequest($existingFriendship)) {
            return redirect()->back()->with('error', $error);
        }
        Friend::create([
            'user_id' => $currentUser->id,
            'friend_id' => $friendId,
            'status' => 'pending',
        ]);
        return redirect()->back()->with('success', 'Friend request sent successfully');
    }

    public function acceptFriend(Request $request)
    {
        $this->validateRequest($request, ['friend_id' => self::VALIDATION_RULES['friend_id']]);
        $friendship = $this->findPendingRequest($request->friend_id, Auth::id());
        if (!$friendship) {
            return redirect()->back()->with('error', 'Friend request not found');
        }
        $friendship->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
        return redirect()->back()->with('success', 'Friend request accepted');
    }

    public function rejectFriend(Request $request)
    {
        $this->validateRequest($request, ['friend_id' => self::VALIDATION_RULES['friend_id']]);
        $friendship = $this->findPendingRequest($request->friend_id, Auth::id());
        if (!$friendship) {
            return redirect()->back()->with('error', 'Friend request not found');
        }
        $friendship->delete();
        return redirect()->back()->with('success', 'Friend request rejected');
    }

    public function cancelPendingRequest(Request $request)
    {
        $this->validateRequest($request, ['friend_id' => self::VALIDATION_RULES['friend_id']]);
        $currentUser = Auth::user();
        $friendId = $request->friend_id;
        if ($this->isSelfAction($currentUser->id, $friendId)) {
            return redirect()->back()->with('error', 'Cannot cancel request to yourself');
        }
        $friendship = $this->findPendingRequest($currentUser->id, $friendId);
        
        if (!$friendship) {
            return redirect()->back()->with('error', 'Pending friend request not found');
        }
        $friendship->delete();
        return redirect()->back()->with('success', 'Friend request cancelled successfully');
    }

    public function removeFriend(Request $request)
    {
        $this->validateRequest($request, ['friend_id' => self::VALIDATION_RULES['friend_id']]);
        $friendship = Auth::user()->friendshipWith(User::find($request->friend_id));
        if (!$friendship || $friendship->status !== 'accepted') {
            return redirect()->back()->with('error', 'Friendship not found');
        }
        $friendship->delete();
        return redirect()->back()->with('success', 'Friend removed successfully');
    }

    public function blockFriend(Request $request)
    {
        $this->validateRequest($request, [
            'friend_id' => self::VALIDATION_RULES['friend_id'],
            'reason' => self::VALIDATION_RULES['block_reason'],
        ]);
        $currentUser = Auth::user();
        $friendId = $request->friend_id;
        if ($this->isSelfAction($currentUser->id, $friendId)) {
            return redirect()->back()->with('error', 'Cannot block yourself');
        }
        $friendship = $currentUser->friendshipWith(User::find($friendId));
        if ($friendship) {
            $blockData = array_merge($this->getBlockData($request->reason), ['status' => 'blocked']);
            $friendship->update($blockData);
        } else {
            $createData = array_merge([
                'user_id' => $currentUser->id,
                'friend_id' => $friendId,
                'status' => 'blocked',
            ], $this->getBlockData($request->reason));
            Friend::create($createData);
        }
        return redirect()->back()->with('success', 'User blocked successfully');
    }

    public function unblockFriend(Request $request)
    {
        $this->validateRequest($request, ['friend_id' => self::VALIDATION_RULES['friend_id']]);
        $friendship = Friend::where([
            ['user_id', Auth::id()],
            ['friend_id', $request->friend_id],
            ['status', 'blocked']
        ])->first();
        if (!$friendship) {
            return redirect()->back()->with('error', 'Blocked relationship not found');
        }
        $friendship->delete();
        return redirect()->back()->with('success', 'User unblocked successfully');
    }

    private function validateRequest(Request $request, array $rules): void
    {
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            abort(400, 'Invalid input');
        }
    }

    private function formatUsers($users)
    {
        return $users->map(fn($user) => collect($user->toArray())
            ->only(self::USER_FIELDS)
            ->toArray()
        );
    }

    private function formatUserWithRelationship(User $user, User $currentUser): array
    {
        $friendship = $user->friendshipWith($currentUser);
        
        return array_merge(
            collect($user->toArray())->only(self::USER_FIELDS)->toArray(),
            [
                'relationship_status' => $friendship?->status,
                'can_add' => !$friendship || $friendship->status === 'blocked',
            ]
        );
    }

    private function findPendingRequest(int $fromUserId, int $toUserId): ?Friend
    {
        return Friend::where([
            ['user_id', $fromUserId],
            ['friend_id', $toUserId],
            ['status', 'pending']
        ])->first();
    }

    private function validateFriendRequest($existingFriendship): ?string
    {
        if (!$existingFriendship) {
            return null;
        }

        return match ($existingFriendship->status) {
            'accepted' => 'Already friends with this user',
            'pending' => 'Friend request already pending',
            'blocked' => 'Cannot add blocked user as friend',
            default => null,
        };
    }

    private function getBlockData(?string $reason): array
    {
        return [
            'blocked_at' => now(),
            'report_reason' => $reason,
        ];
    }

    private function isSelfAction(int $currentUserId, int $targetUserId): bool
    {
        return $currentUserId === $targetUserId;
    }

}