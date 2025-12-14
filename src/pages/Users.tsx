import React, { useState } from "react"; // add this import at the top
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";

// ✅ Shared components
import ClientNavbar from "../components/UsersNavbar";
import ClientSidebar from "../components/Sidebar";
import ResponseModal from "../components/ResponseModal";
import { useUser } from "@clerk/clerk-react";

const Users: React.FC = () => {
  const { user: clerkUser } = useUser();

  // ✅ Tabs: users or invites
  const [activeTab, setActiveTab] = useState<"users" | "invites">("users");

  // ✅ Filters & search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteStatusFilter, _setInviteStatusFilter] = useState("all");
  const revokeInvite = useAction(api.functions.invites.revokeInvite);

  
  // ✅ Convex queries
  const users = useQuery(api.users.listAllUsers) || [];
  const invitations = useQuery(api.invitation.listInvites, {}) || [];

  // ✅ Convex actions
  const updateUserMutation = useAction(api.functions.updateClerkUser.updateClerkUser);
  const sendInvite = useAction(api.functions.invites.sendClerkInvite);

  // ✅ Modal states
  const [editingUser, setEditingUser] = useState<any>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // ✅ Edit modal fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // ✅ Invite modal fields
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "client" | "designer">("designer");

  // ✅ Response modal state
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  // ✅ Modal handlers
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
  };
  const closeEditModal = () => {
    setEditingUser(null);
    setFirstName("");
    setLastName("");
    setEmail("");
  };
  const openInviteModal = () => setInviteModalOpen(true);
  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteEmail("");
    setInviteRole("designer");
  };

  // ✅ Handle update user
  const handleUpdate = async () => {
    if (!editingUser) return;
    const payload: any = { userId: editingUser.clerkId, firstName, lastName };
    if (email !== editingUser.email) payload.email = email;
    try {
      const result = await updateUserMutation(payload);
      if (result.success) {
        setResponseModal({
          isOpen: true,
          type: "success",
          title: "Success!",
          message: "User updated successfully!",
        });
        closeEditModal();
      } else {
        setResponseModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: `Failed: ${result.message}`,
        });
      }
    } catch (err) {
      console.error(err);
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Error updating user",
      });
    }
  };

  // ✅ Handle invite user
  const handleInviteUser = async () => {
    if (!inviteEmail) {
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Please enter an email",
      });
      return;
    }
    try {
      const result = await sendInvite({ email: inviteEmail, role: inviteRole });
      if (result.emailSent) {
        setResponseModal({
          isOpen: true,
          type: "success",
          title: "Success!",
          message: `Invitation sent to ${inviteEmail} as ${inviteRole}`,
        });
        closeInviteModal();
      } else {
        setResponseModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: `Failed to send invite: ${result.message}`,
        });
      }
    } catch (err) {
      console.error(err);
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to send invite. Check console for details.",
      });
    }
  };

  // ✅ Filter users
  const filteredUsers = users
    .filter((u: any) => u.clerkId !== clerkUser?.id)
    .filter((u: any) => {
      const matchesSearch =
        u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

  // ✅ Filter invitations
  const filteredInvites = invitations
    .filter((inv: any) => {
      const matchesSearch = inv.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        inviteStatusFilter === "all" ? true : inv.status === inviteStatusFilter;
      return matchesSearch && matchesStatus;
    });

  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* ✅ Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "users" ? " text-teal-600 bg-gray-100" : " text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "invites" ? " text-teal-600 bg-gray-100" :  " text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab("invites")}
            >
              Invitations
            </button>
          </div>

         {/* ✅ Search + Filters */}
          <motion.div
            className="flex flex-col gap-3 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {activeTab === "users" ? (
              <>
                {/* Mobile: Users Search */}
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="md:hidden border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {/* Users Filter + Invite + Search (Desktop) */}
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  {/* Desktop Search - 2/3 width */}
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="hidden md:block border border-gray-300 rounded-lg px-3 py-2 flex-[2] focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {/* Filter - 1/3 width */}
                  <select
                    aria-label="Filter users by role"
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="client">Client</option>
                    <option value="designer">Designer</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    type="button"
                    onClick={openInviteModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    Invite User
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Mobile: Invitations Search */}
                <input
                  type="text"
                  placeholder="Search by email..."
                  className="md:hidden border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {/* Invitations Status Filter + Search (Desktop) */}
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  {/* Desktop Search - 2/3 width */}
                  <input
                    type="text"
                    placeholder="Search by email..."
                    className="hidden md:block border border-gray-300 rounded-lg px-3 py-2 flex-[2] focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {/* Filter - 1/3 width */}
                  <select
                    aria-label="Filter invitations by status"
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={inviteStatusFilter}
                    onChange={(e) => _setInviteStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </>
            )}
          </motion.div>


          {/* ✅ Table / Cards */}
          <motion.div className="bg-white shadow-md rounded-lg p-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              {activeTab === "users" ? (
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">First Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any, idx: number) => (
                      <motion.tr
                        key={user._id}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">{user.firstName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.lastName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                        <td className="px-4 py-3 text-sm capitalize text-gray-700">{user.role}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            className="px-6 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created At</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvites.map((inv: any, idx: number) => (
                      <tr
                        key={inv._id}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.email}</td>
                        <td className="px-4 py-3 text-sm capitalize text-gray-700">{inv.status}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(inv.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          {inv.status === "pending" ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Revoke invite for ${inv.email}?`)) {
                                  const result = await revokeInvite({ email: inv.email });
                                  if (result?.success) {
                                    setResponseModal({
                                      isOpen: true,
                                      type: "success",
                                      title: "Success!",
                                      message: `Invitation revoked for ${inv.email}`,
                                    });
                                  } else {
                                    setResponseModal({
                                      isOpen: true,
                                      type: "error",
                                      title: "Error",
                                      message: "Failed to revoke invite",
                                    });
                                  }
                                }
                              }}
                              className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {activeTab === "users" ? (
                filteredUsers.map((user: any) => (
                  <motion.div
                    key={user._id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="text-gray-700">{user.firstName} {user.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="text-gray-700 text-sm">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Role:</span>
                        <span className="capitalize text-gray-700">{user.role}</span>
                      </div>
                      <button
                        type="button"
                        className="w-full mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                filteredInvites.map((inv: any) => (
                  <motion.div
                    key={inv._id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="text-gray-700 text-sm">{inv.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="capitalize text-gray-700">{inv.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="text-gray-700 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                      {inv.status === "pending" ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Revoke invite for ${inv.email}?`)) {
                              const result = await revokeInvite({ email: inv.email });
                              if (result?.success) {
                                setResponseModal({
                                  isOpen: true,
                                  type: "success",
                                  title: "Success!",
                                  message: `Invitation revoked for ${inv.email}`,
                                });
                              } else {
                                setResponseModal({
                                  isOpen: true,
                                  type: "error",
                                  title: "Error",
                                  message: "Failed to revoke invite",
                                });
                              }
                            }
                          }}
                          className="w-full mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Revoke
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 🟢 Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-6 text-gray-600">Invite New User</h2>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="border border-gray-400 w-full rounded-lg p-2 mb-3"
              placeholder="Enter user email"
            />
            <select
              aria-label="Select user role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "client" | "designer")}
              className="border border-gray-400 w-full rounded-lg p-2 mb-3"
            >
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="designer">Designer</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded-lg"
                onClick={closeInviteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={handleInviteUser}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-8 text-gray-800">Update User Profile</h2>
            <input
              className="border border-gray-400 w-full rounded-lg p-2 mb-3"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="border border-gray-400 w-full rounded-lg p-2 mb-3"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              className="border border-gray-400 w-full rounded-lg p-2 mb-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded-lg"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg"
                onClick={handleUpdate}
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}

      <ResponseModal
        isOpen={responseModal.isOpen}
        type={responseModal.type}
        title={responseModal.title}
        message={responseModal.message}
        onClose={() => setResponseModal({ ...responseModal, isOpen: false })}
      />
    </div>
  );
};

export default Users;
