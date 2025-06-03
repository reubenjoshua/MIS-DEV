import { RoleType, AreaType, BranchType, UserProfile, DashboardType } from "@/models/User";

export const mockRoles: RoleType [] = [
    { ID: 1, roleName: "Super Admin" },
    { ID: 2, roleName: "Central Admin" },
    { ID: 3, roleName: "Branch Admin" },
    { ID: 4, roleName: "Encoder" }
];

export const mockAreas: AreaType [] = [
    { ID: 1, areaCode: 100, areaName: "JV" }
];

export const mockBranch: BranchType [] = [
    { ID: 1, branchCode: 101, branchName: "Batangas" }
];

export const mockUserProfile: (UserProfile &
{
    Area?:      string;
    Branch?:    string;
}) [] = [
    {
        ID:         1,
        FirstName:  "Super",
        LastName:   "Admin",
        Email:      "superadmin@example.com",
        Username:   "superadmin",
        Password:   "1234",
        Role:       1
    },
    {
        ID:         2,
        FirstName:  "Central",
        LastName:   "Admin",
        Email:      "centraladmine@example.com",
        Username:   "central",
        Password:   "4567",
        Role:       2
    },
    {
        ID:         3,
        FirstName:  "Branch",
        LastName:   "Admin",
        Email:      "branchadmin@example.com",
        Username:   "branch",
        Password:   "7890",
        Role:       3,
        Area:       "JV"
    },
    {
        ID:         4,
        FirstName:  "Data",
        LastName:   "Encoder",
        Email:      "encoder@example.com",
        Username:   "encoder",
        Password:   "9012",
        Role:       4,
        Area:       "JV",
        Branch:     "Batangas"
    }
];

export const dashboardProvider: (DashboardType & { Role: number }) [] = [
    {
        Role:           1,
        ActiveUsers:    4,
        Areas:          1,
        Branches:       1,
        // Pending:        0,
        Approved:       0,
        // Declined:       0,
        // Encoded:        0
    },
    {
        Role:           2,
        ActiveUsers:    3,
        Areas:          1,
        Branches:       1,
        Pending:        0,
        Approved:       0,
        Declined:       0,
        Encoded:        0
    },
    {
        Role:           3,
        ActiveUsers:    2,
        Areas:          1,
        Branches:       1,
        Pending:        0,
        Approved:       0,
        Declined:       0,
        Encoded:        0
    },
    {
        Role:           4,
        ActiveUsers:    1,
        Areas:          1,
        Branches:       1,
        Pending:        0,
        Approved:       0,
        Declined:       0,
        Encoded:        0
    }
];

// export const fetchByUsername = (username: string) => {
//     return mockUserProfile.find (user => user.Username === username);
// };

// export const fetchUserByID = (roleId: number) => {
//     return mockRoles.find (role => role.ID === roleId);
// };

export const mockLoginAPI = async (userData : {Username: string, Password: string}): 
    Promise <
        | { success: true; data: { token: string, user: UserProfile & { Area?: string; Branch?: string }}}
        | { success: false; error: string; }
        > => {
    const user = mockUserProfile.find ((user) => 
        (userData.Username === user.Username || user.Email === userData.Username) &&
        (userData.Password === user.Password));

    if (!user)
    {
        return {
            success: false,
            error: "Invalid credentials"
        };
    }

    const token = btoa (`${user.Username}:${user.Password}`);

    return {
        success: true,
        data:
        {
            token,
            user,
        },
    };
};

export const mockFetchUserDetails = async (token: string) => {
    try
    {
        const [username] = atob (token).split(":");
        const user = mockUserProfile.find (user => user.Username === username);

        return user || null;
    }
    catch
    {
        return null;
    }
};